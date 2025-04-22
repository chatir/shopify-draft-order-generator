const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json()); // to parse JSON bodies

const PORT = process.env.PORT || 3000;

// Shopify settings
const SHOP = 'baknbak.myshopify.com';
const ACCESS_TOKEN = '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';

app.post('/create-draft-order', async (req, res) => {
  const { variant_id, quantity } = req.body;

  try {
    const response = await axios.post(
      `https://${SHOP}/admin/api/2024-04/draft_orders.json`,
      {
        draft_order: {
          line_items: [
            {
              variant_id,
              quantity
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

    // 🧪 Log full response from Shopify to Render logs
    console.log('Shopify response:', response.data);

    const draftOrder = response.data.draft_order;

    if (!draftOrder) {
      return res.status(500).json({ success: false, error: response.data });
    }

    const invoiceUrl = draftOrder.invoice_url;
    res.json({ success: true, url: invoiceUrl });
  } catch (error) {
    console.error('Error from Shopify:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

