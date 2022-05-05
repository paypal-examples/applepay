const { NODE_ENV, CLIENT_ID, CLIENT_SECRET } = process.env;

module.exports = {
  PORT: process.env.PORT || 8080,
  PAYPAL_API_BASE: process.env.PAYPAL_API_BASE || "https://api.sandbox.paypal.com",
  NODE_ENV, CLIENT_ID, CLIENT_SECRET,
  DISABLE_CAPTURE: process.env.DISABLE_CAPTURE === "true"
};