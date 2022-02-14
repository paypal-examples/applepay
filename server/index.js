const express = require("express");
const { resolve } = require("path");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const { getAccessToken } = require("./paypal");
const { WEBHOOK_ID, PORT, PAYPAL_API_BASE } = require("./config");
const { requireHTTPS } = require("./middleware");

const app = express();

app.use(requireHTTPS);
app.use(express.json());
app.use(express.static(resolve(__dirname, "../examples")));

app.get("/", (req, res) => {
  res.sendFile(resolve(__dirname, "../examples/index.html"));
});

app.get(
  "/.well-known/apple-developer-merchantid-domain-association",
  (req, res) => {
    res.sendFile(
      resolve(__dirname, "../.well-known/apple-developer-domain-association")
    );
  }
);

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
  } catch (err) {
    res.status(422).json(err.response.data);
  }
});

app.post("/calculate-shipping", (req, res) => {
  const { shipping_address } = req.body;

  const { postal_code } = shipping_address;

  /*
   * Calc Sales Tax
   */
  const taxRate = ((Math.random() * 10) / 100).toFixed(2); // tax rate 0 - 10%

  console.log(`Fake Sales Tax Rate ${taxRate}% for postalcode ${postal_code}`);

  /*
   * Get updated shipping options:
   * if there is a change in shipping address geographically different shipping options may now apply
   * pass these back here if so.
   */
  const updatedShippingOptions = [
    {
      id: "SHIP_123",
      label: "1-3 Day Shipping",
      type: "SHIPPING",
      selected: true,
      amount: {
        value: "2.99",
        currency_code: "USD",
      },
    },
    {
      id: "SHIP_456",
      label: "Pick up in Store",
      type: "PICKUP",
      selected: false,
      amount: {
        value: "0.00",
        currency_code: "USD",
      },
    },
  ];

  /*
  * is shipping taxable ? 
  * Some states it’s taxable. Others it’s not
  * https://www.taxjar.com/blog/08-21-sales-tax-and-shipping
  */
  const isShippingTaxable = false

  res.json({
    taxRate,
    updatedShippingOptions,
    isShippingTaxable
  });
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
