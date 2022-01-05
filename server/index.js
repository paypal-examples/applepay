const express = require("express");
const { resolve } = require("path");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const { getAccessToken } = require("./oauth");
const { WEBHOOK_ID, PORT, PAYPAL_API_BASE } = require("./config");

const app = express();

app.use(express.static(resolve(__dirname, "../client")));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(resolve(__dirname, "../client/index.html"));
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

    console.log({ orderId })
    console.log(JSON.stringify(req.body, null, 4))
  
    const body = [
      {
        op: "replace",
        path: "/purchase_units/@reference_id=='default'/amount",
        value: {
          currency_code: "USD",
          value: "99.00",
        },
      },
    ];

    
    const { data } = await axios({
      url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      data: body //req.body,
    });
    
    
    console.log(`Payment patched!`);
    res.json(data);
  } catch(err){
    console.log(err)
    res.json({ msg: err.message, details: err.toString() })
  }

});


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