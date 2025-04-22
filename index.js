// index.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Allow only your storefront to call this
app.use(cors({
  origin: 'https://baknbak.myshopify.com',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;
const SHOP = 'baknbak.myshopify.com';
// ← This must be your Storefront token (from API credentials → Storefront API)
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

app.post('/create-draft-order', async (req, res) => {
  const { variant_id, quantity } = req.body;
  if (!variant_id || !quantity) {
    return res.status(400).json({ success: false, error: 'variant_id & quantity required' });
  }

  // GraphQL mutation to create a checkout
  const gql = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout { webUrl }
        userErrors { message }
      }
    }
  `;
  const vars = {
    input: {
      lineItems: [{
        variantId: `gid://shopify/ProductVariant/${variant_id}`,
        quantity: parseInt(quantity, 10)
      }]
    }
  };

  try {
    const { data } = await axios.post(
      `https://${SHOP}/api/2025-04/graphql.json`,
      { query: gql, variables: vars },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN
        }
      }
    );

    // If there are any GraphQL or user errors, show them
    if (data.errors?.length || data.data.checkoutCreate.userErrors.length) {
      const errs = (data.errors || data.data.checkoutCreate.userErrors)
        .map(e => e.message).join('; ');
      return res.status(500).json({ success: false, error: errs });
    }

    // Success! Send back the checkout URL
    return res.json({
      success: true,
      url: data.data.checkoutCreate.checkout.webUrl
    });

  } catch (err) {
    console.error('GraphQL error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Listening on port ${PORT}`));
