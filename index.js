const ACCESS_TOKEN = process.env.SHOPIFY_API_TOKEN?.trim();
const express = require('express');
const axios   = require('axios');
const cors    = require('cors');

const app = express();
app.use(cors({ origin: 'https://baknbak.myshopify.com' }));
app.use(express.json());

const PORT        = process.env.PORT || 3000;
const SHOP        = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_API_TOKEN;

app.post('/create-draft-order', async (req, res) => {
  const { variant_id, quantity } = req.body;
  if (!variant_id || !quantity) {
    return res.status(400).json({ success:false, error:'variant_id & quantity required' });
  }

  // 1) Create the draft
  const mutation = `
    mutation($input: DraftOrderInput!) {
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
      { query: mutation, variables },
      { headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ACCESS_TOKEN
      }}
    );

    // Handle any user errors
    const errs = data.errors || data.data.draftOrderCreate.userErrors;
    if (errs?.length) {
      return res.status(500).json({ success:false, error: errs.map(e=>e.message).join('; ') });
    }

    // Success: return the invoice URL
    const url = data.data.draftOrderCreate.draftOrder.invoiceUrl;
    return res.json({ success:true, url });

  } catch (err) {
    console.error('⚠️ GraphQL error:', err.response?.data || err.message);
    return res.status(500).json({ success:false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Listening on port ${PORT}`));
