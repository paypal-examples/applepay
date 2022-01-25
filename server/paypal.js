const axios = require("axios");

const { PAYPAL_API_BASE, CLIENT_ID, CLIENT_SECRET } = require("./config");

async function getAccessToken() {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const { data } = await axios({
    url: `${PAYPAL_API_BASE}/v1/oauth2/token`,
    method: "post",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: "grant_type=client_credentials",
  });

  return data;
}

module.exports = {
  getAccessToken,
};
