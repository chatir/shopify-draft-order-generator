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

const PORT          = process.env.PORT || 3000;
const SHOP          = 'baknbak.myshopify.com';
const ACCESS_TOKEN  = process.env.SHOPIFY_API_TOKEN;       // ← Admin API token

app.post('/create-draft-order', async (req, res) => {
  const { variant_id, quantity } = req.body;
  if (!variant_id || !quantity) {
    return res.status(400).json({ success: false, error: 'variant_id & quantity required' });
  }

  // Admin GraphQL mutation to create a draft order
  const gql = `
    mutation DraftOrder($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder { invoiceUrl }
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
    const { data } = await axios.post(
      `https://${SHOP}/admin/api/2025-04/graphql.json`,
      { query: gql, variables },
      {
        headers: {
          'X-Shopify-Access-Token': ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    // Handle any errors
    const errs = data.errors || data.data.draftOrderCreate.userErrors;
    if (errs?.length) {
      return res.status(500).json({
        success: false,
        error: errs.map(e => e.message).join('; ')
      });
    }

    // Success
    const url = data.data.draftOrderCreate.draftOrder.invoiceUrl;
    return res.json({ success: true, url });

  } catch (err) {
    console.error('🛑 Admin‑GraphQL error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Listening on port ${PORT}`));
