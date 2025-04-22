const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const SHOP = 'baknbak.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_API_TOKEN; // Use ENV for safety

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

    const invoiceUrl = response.data.draft_order.invoice_url;
    res.json({ success: true, url: invoiceUrl });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
