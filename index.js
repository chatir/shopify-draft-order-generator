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

