const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Allow your Shopify storefront to talk to this backend
app.use(cors({
  origin: 'https://baknbak.myshopify.com',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SHOP = 'baknbak.myshopify.com';
// This is your **Storefront API** token (from Develop apps → Storefront API scopes)
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

app.post('/create-draft-order', async (req, res) => {
  const { variant_id, quantity } = req.body;
  if (!variant_id || !quantity) {
    return res.status(400).json({ success: false, error: 'variant_id and quantity required' });
  }

  const query = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout { webUrl }
        userErrors { message }
      }
    }
  `;

  const variables = {
    input: {
      lineItems: [{
        variantId: `gid://shopify/ProductVariant/${variant_id}`,
        quantity: parseInt(quantity, 10)
      }]
    }
  };

  try {
    const graphqlRes = await axios.post(
      `https://${SHOP}/api/2025-04/graphql.json`,
      { query, variables },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN
        }
      }
    );

    const body = graphqlRes.data;
    if (body.errors?.length || body.data.checkoutCreate.userErrors.length) {
      const errs = (body.errors || body.data.checkoutCreate.userErrors)
        .map(e => e.message).join('; ');
      return res.status(500).json({ success: false, error: errs });
    }

    const webUrl = body.data.checkoutCreate.checkout.webUrl;
    return res.json({ success: true, url: webUrl });

  } catch (err) {
    console.error('GraphQL error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
