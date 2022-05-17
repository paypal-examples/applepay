const { NODE_ENV, CLIENT_ID, CLIENT_SECRET } = process.env;

module.exports = {
  PORT: process.env.PORT || 8080,
  PAYPAL_API_BASE: process.env.PAYPAL_API_BASE || "https://api.paypal.com", //  "https://api.sandbox.paypal.com",
  NODE_ENV, CLIENT_ID, CLIENT_SECRET
};