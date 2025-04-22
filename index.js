const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// ✅ Allow Shopify to access this backend
app.use(cors({
  origin: 'https://baknbak.myshopify.com',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ Your Shopify info
const SHOP = 'baknbak.myshopify.com';
const ACCESS_TOKEN = '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';

// ✅ Handle POST request from your product page
app.post('/create-draft-order', async (req, res) => {
  const { variant_id, quantity } = req.body;

  if (!variant_id || !quantity) {
    return res.status(400).json({ success: false, error: 'Missing variant_id or quantity' });
  }

  try {
    const response = await axios.post(
      `https://${SHOP}/admin/api/unstable/draft_orders.json`,
      {
        draft_order: {
          line_items: [
            {
              variant_id: parseInt(variant_id),
              quantity: parseInt(quantity)
            }
          ]
        }
      },
      {
        headers: {
          'X-Shopify-Access-Token': ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    const draftOrder = response.data.draft_orders?.[0];
    const invoiceUrl = draftOrder?.invoice_url;

    if (invoiceUrl) {
      res.json({ success: true, url: invoiceUrl });
    } else {
      res.status(500).json({ success: false, error: 'Invoice URL not found in response' });
    }

  } catch (error) {
    console.error('Shopify API Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'An error occurred while creating the draft order' });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
