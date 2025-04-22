const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: 'https://baknbak.myshopify.com',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;
const SHOP = 'baknbak.myshopify.com';
const ACCESS_TOKEN = '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';

// ✅ Create draft order route
app.post('/create-draft-order', async (req, res) => {
  const { variant_id, quantity } = req.body;

  if (!variant_id || !quantity) {
    return res.status(400).json({ success: false, error: 'Missing variant_id or quantity' });
  }

  try {
    const response = await axios.post(
`https://${SHOP}/admin/api/2024-04/draft_orders.json`
      {
        draft_order: {
          line_items: [{
            variant_id: parseInt(variant_id),
            quantity: parseInt(quantity)
          }]
        }
      },
      {
        headers: {
          'X-Shopify-Access-Token': ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    // 🧪 Log the full Shopify response to diagnose
    console.log('📦 Shopify response:', JSON.stringify(response.data, null, 2));

    const draftOrder = response.data.draft_order;
    const invoiceUrl = draftOrder?.invoice_url;

    if (invoiceUrl) {
      res.json({ success: true, url: invoiceUrl });
    } else {
      res.status(500).json({
        success: false,
        error: 'Invoice URL not found in response',
        shopify_data: response.data
      });
    }

  } catch (error) {
    console.error('❌ Shopify API error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
