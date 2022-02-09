const express = require("express");
const { resolve } = require("path");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const { getAccessToken } = require("./paypal");
const { WEBHOOK_ID, PORT, PAYPAL_API_BASE } = require("./config");

const app = express();

// require HTTPS
app.use((req, res, next) => {
  // The 'x-forwarded-proto' check is for Heroku
  if (req.get('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.get('host')}${req.url}`);
  } else {
    next();
  }
});

app.use(express.static(resolve(__dirname, "../examples")));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(resolve(__dirname, "../examples/index.html"));
});

app.get("/.well-known/apple-developer-merchantid-domain-association", (req, res) => {
  res.sendFile(resolve(__dirname, "../.well-known/apple-developer-domain-association"));
});

app.post("/capture/:orderId", async (req, res) => {
  const { orderId } = req.params;

  const { access_token } = await getAccessToken();

  const { data } = await axios({
    url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  });

  console.log(`💰 Payment captured!`);
  res.json(data);
});

app.patch("/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const { access_token } = await getAccessToken();

    const { data } = await axios({
      url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      data: req.body,
    });
        
    console.log(`Payment patched!`);
    res.json(data);
  } catch(err){
    console.log(err)
    res.json({ msg: err.message, details: err.toString(), body: req.body, orderId, })
  }

});

app.post("/calculate-shipping", async (req, res) => {
  const { orderID, selected_shipping_option } = req.body;

  let orderRes 
  try {
    const { access_token } = await getAccessToken();

    const { data } = await axios({
      url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      }
    });
  
    orderRes = data

    const {
      breakdown: { item_total, tax_total },
    } = data.purchase_units[0].amount;
  
    const itemTotal = parseFloat(item_total.value, 10);
    const taxAmount = parseFloat(tax_total.value, 10);
  
    let shippingMethodAmount = parseFloat("0.00", 10);
  
    if (selected_shipping_option.amount.value) {
      shippingMethodAmount = parseFloat(
        selected_shipping_option.amount.value,
        10
      );
  
      selected_shipping_option.selected = true;
    }
  
    data.amount.value = (
      itemTotal +
      taxAmount +
      shippingMethodAmount
    ).toFixed(2);
  
    await axios({
      url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}`,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      data:  JSON.stringify([
        {
          op: "replace",
          path: "/purchase_units/@reference_id=='default'/amount",
          value: data.amount,
        },
      ]),
    });
  
    res.json({ msg: "ok" });
  } catch(err){
    res.json({ msg: err.message, details: err.toString(), body: req.body, orderID, orderRes })
  }

})

/**
 * Webhook handlers.
 */
app.post("/webhook", async (req, res) => {
  const { access_token } = await getAccessToken();

  const { event_type, resource } = req.body;
  const orderId = resource.id;

  console.log(`🪝 Recieved Webhook Event`);

  /* verify the webhook signature */
  try {
    const { data } = await axios({
      url: `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      data: {
        transmission_id: req.headers["paypal-transmission-id"],
        transmission_time: req.headers["paypal-transmission-time"],
        cert_url: req.headers["paypal-cert-url"],
        auth_algo: req.headers["paypal-auth-algo"],
        transmission_sig: req.headers["paypal-transmission-sig"],
        webhook_id: WEBHOOK_ID,
        webhook_event: req.body,
      },
    });

    const { verification_status } = data;

    if (verification_status !== "SUCCESS") {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`);
    return res.sendStatus(400);
  }

  /* capture the order */
  if (event_type === "CHECKOUT.ORDER.APPROVED") {
    try {
      await axios({
        url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      });

      console.log(`💰 Payment captured!`);
    } catch (err) {
      console.log(`❌ Payment failed.`);
      return res.sendStatus(400);
    }
  }

  res.sendStatus(200);
});

app.listen(PORT, async () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});