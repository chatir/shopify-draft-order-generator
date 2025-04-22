app.get('/generate-all', async (req, res) => {
  try {
    // 1. Get all products (you can paginate later if needed)
    const productRes = await axios.get(`https://${SHOP}/admin/api/2024-04/products.json?limit=50`, {
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN
      }
    });

    const products = productRes.data.products;
    const links = [];

    for (const product of products) {
      const variantId = product.variants[0]?.id;
      const productTitle = product.title;

      if (!variantId) continue;

      // 2. Create draft order for each product
      const draftRes = await axios.post(
        `https://${SHOP}/admin/api/2024-04/draft_orders.json`,
        {
          draft_order: {
            line_items: [{
              variant_id: variantId,
              quantity: 1
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

      const draftOrder = draftRes.data.draft_order;
      links.push({
        product: productTitle,
        link: draftOrder.invoice_url
      });
    }

    res.json({ success: true, links });
  } catch (err) {
    console.error('❌ Error generating all draft orders:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});
