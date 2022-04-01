const express = require("express");
const { resolve } = require("path");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const { getAccessToken } = require("./paypal");
const { PORT, PAYPAL_API_BASE } = require("./config");
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

  const captureId = data.purchase_units[0].payments.captures[0].id
  const captureStatus = data.purchase_units[0].payments.captures[0].status
  const captureDebugID = headers['paypal-debug-id']
  res.json({
    captureDebuggId: captureDebugID,
    capture: data
  });
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
  const { shipping_address, selected_shipping_option } = req.body;

  const { postal_code } = shipping_address;

  /*
   * Fetch sales tax rate for postal code
   */
  const taxRate = ((Math.random() * 10) / 100).toFixed(2); // tax rate 0 - 10%

  console.log(`Fake Sales Tax Rate ${taxRate}% for postalcode ${postal_code}`);

  /*
   * Get updated shipping options:
   * if there is a change in shipping address geographically different shipping options may now apply
   */
  let updatedShippingOptions = [
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


  const hasSelectedOption = updatedShippingOptions.find(
    (option) => option.label !== selected_shipping_option.label
  );

  // updated shipping options has selected option
  if(hasSelectedOption){
    updatedShippingOptions = updatedShippingOptions.map(option => ({
      ...option,
      selected: option.label === selected_shipping_option.label
    }))
  }

  // is shipping taxable for postal_code
  const isShippingTaxable = false;

  res.json({
    taxRate,
    updatedShippingOptions,
    isShippingTaxable,
  });
});

app.listen(PORT, async () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
