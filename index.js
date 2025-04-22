const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Allow your Shopify store to talk to this backend
app.use(cors({
  origin: 'https://baknbak.myshopify.com',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;
const SHOP = 'baknbak.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_API_TOKEN; // ← use env var

app.post('/create-draft-order', async (req, res) => {
  const { variant_id, quantity } = req.body;
  if (!variant_id || !quantity) {
    return res.status(400).json({ success: false, error: 'Missing variant_id or quantity' });
  }

  console.log('Creating draft order for variant', variant_id, 'qty', quantity);

  try {
    const response = await axios.post(
      `https://${SHOP}/admin/api/2025-04/draft_orders.json`, // ← updated version
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

    console.log('Shopify response:', JSON.stringify(response.data, null, 2));

    const invoiceUrl = response.data.draft_order?.invoice_url;
    if (invoiceUrl) {
      return res.json({ success: true, url: invoiceUrl });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Invoice URL not found in response',
        shopify_data: response.data
      });
    }

  } catch (error) {
    console.error('Shopify API error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
