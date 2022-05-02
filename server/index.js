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

  const { data, headers } = await axios({
    url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  });

  const debugID = headers["paypal-debug-id"];

  res.json({ debugID, ...data });
});

app.patch("/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const { access_token } = await getAccessToken();

    const { data, headers } = await axios({
      url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      data: req.body,
    });

    const debugID = headers["paypal-debug-id"];

    res.json({ debugID, ...data });
  } catch (err) {
    res.status(422).json(err.response.data);
  }
});

app.post("/calculate-shipping", (req, res) => {
  res.json({
    taxRate: 0.0725, // 7.25%
  });
});

app.listen(PORT, async () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
