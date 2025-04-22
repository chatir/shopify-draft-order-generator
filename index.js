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

  // Check if both variant_id and quantity are provided
  if (!variant_id || !quantity) {
    return res.status(400).json({ success: false, error: 'variant_id and quantity are required' });
  }

  try {
    // Create a draft order with the provided variant_id and quantity
    const response = await axios.post(
      `https://${SHOP}/admin/api/unstable/draft_orders.json`,
      {
        draft_order: {
          line_items: [
            {
              variant_id: variant_id,
              quantity: quantity
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

    // Extract the invoice URL from the response
    const draftOrder = response.data.draft_orders?.[0];
    const invoiceUrl = draftOrder?.invoice_url;

    // Check if invoice_url exists in the response
    if (invoiceUrl) {
      res.json({ success: true, url: invoiceUrl });
    } else {
      res.json({ success: false, error: 'Invoice URL not found in response' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'An error occurred while creating the draft order' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
