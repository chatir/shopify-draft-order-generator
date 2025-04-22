// index.js
const express = require('express')
const fetch = require('node-fetch')
const cors = require('cors')
const app = express()

app.use(cors({ origin: 'https://baknbak.myshopify.com' }))
app.use(express.json())

const PORT = process.env.PORT || 3000
const SHOP = 'baknbak.myshopify.com'
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN

app.post('/create-checkout', async (req, res) => {
  const { variant_id, quantity } = req.body
  if (!variant_id || !quantity) {
    return res.status(400).json({ success: false, error: 'variant_id & quantity required' })
  }

  const query = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout { webUrl }
        userErrors { field message }
      }
    }
  `

  const variables = {
    input: {
      lineItems: [{ variantId: `gid://shopify/ProductVariant/${variant_id}`, quantity }]
    }
  }

  try {
    const resp = await fetch(`https://${SHOP}/api/2025-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN
      },
      body: JSON.stringify({ query, variables })
    })
    const { data, errors } = await resp.json()
    if (errors?.length || data.checkoutCreate.userErrors.length) {
      const msg = (errors || data.checkoutCreate.userErrors).map(e=>e.message).join('; ')
      return res.status(500).json({ success: false, error: msg })
    }
    return res.json({ success: true, url: data.checkoutCreate.checkout.webUrl })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
})

app.listen(PORT, ()=>console.log(`Listening on ${PORT}`))
