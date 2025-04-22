const express = require('express');
const axios   = require('axios');
const cors    = require('cors');

const app = express();

// CORS: only allow your store’s domain
app.use(cors({
  origin: 'https://baknbak.myshopify.com',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const PORT        = process.env.PORT || 3000;
const SHOP_DOMAIN = process.env.SHOPIFY_STORE;       // e.g. "baknbak.myshopify.com"
const ADMIN_TOKEN = process.env.SHOPIFY_API_TOKEN;   // your shpat_… token

app.post('/create-draft-order', async (req, res) => {
  const { variant_id, quantity } = req.body;
  if (!variant_id || !quantity) {
    return res.status(400).json({ success: false, error: 'variant_id & quantity required' });
  }

  const mutation = `
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
      `https://${SHOP_DOMAIN}/admin/api/2025-04/graphql.json`,
      { query: mutation, variables },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ADMIN_TOKEN
        }
      }
    );

    // Collect any errors
    const errs = data.errors || data.data.draftOrderCreate.userErrors;
    if (errs?.length) {
      const msg = errs.map(e => e.message).join('; ');
      return res.status(500).json({ success: false, error: msg });
    }

    // Return the invoice URL
    const url = data.data.draftOrderCreate.draftOrder.invoiceUrl;
    return res.json({ success: true, url });

  } catch (err) {
    console.error('Admin‑GraphQL error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
