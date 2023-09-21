import "dotenv/config";
import express from "express";
import * as paypal from "./paypal-api.js";
const { PORT = 8888 } = process.env;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

// render checkout page with client id & unique client token
app.get("/", async (req, res) => {
  const clientId = process.env.CLIENT_ID, merchantId = process.env.MERCHANT_ID;
  try {
    const clientToken = await paypal.generateClientToken();
    res.render("checkout", { clientId, clientToken, merchantId });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// create order
app.post("/api/orders", async (req, res) => {
  try {
    const order = await paypal.createOrder();
    res.json(order);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// capture payment
app.post("/api/orders/:orderID/capture", async (req, res) => {
  const { orderID } = req.params;
  try {
    const captureData = await paypal.capturePayment(orderID);
    res.json(captureData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// health check
app.get("/check", (req, res) => {
  res.json({
    message: "ok",
    env: process.env.NODE_ENV,
    clientId: process.env.CLIENT_ID,
    appSecret: process.env.APP_SECRET || "Couldn't load App Secret",
    clientSecret: process.env.CLIENT_SECRET,
    merchantId: process.env.MERCHANT_ID
  })
})

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}/`);
});
