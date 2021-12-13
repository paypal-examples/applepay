const ngrok = require("ngrok");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const { PAYPAL_API_BASE } = require("../server/config");
const { getAccessToken } = require("../server/oauth");

(async function () {
  let proxyURL

  try {
    proxyURL = await ngrok.connect(8080);
  } catch(err){
    console.log(err)
    console.log(`ngrok failed to connect`);
    process.exit(1);
  }

  try {
    const { access_token } = await getAccessToken();

    // Create a webhook to the proxy url
    const { data } = await axios({
      url: `${PAYPAL_API_BASE}/v1/notifications/webhooks`,
      method: "post",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      data: {
        url: proxyURL + "/webhook", // FIXME: make dynamic
        event_types: [
          {
            name: "CHECKOUT.ORDER.APPROVED",
          },
        ],
      },
    });

    formatWebhookCreateResponse(data);

    // on terminal shutdown - delete the webhook
    process.on("SIGINT", async () => {
      const { id } = data;

      await axios({
        url: `${PAYPAL_API_BASE}/v1/notifications/webhooks/${id}`,
        method: "delete",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      });

      console.log("Webhook deleted - id: %s", id);
    });
  } catch (err) {
    console.error(err);
  }
})();

function formatWebhookCreateResponse({ id, url, event_types }) {

console.log(`
✅ Webhook Proxy Running
Webhook ID: 
${id}
Webhook External URL: 
${url}
Forwarding: 
${url} -> http://localhost:8080/webhook
Subscribed Events: 
${event_types.map((evt) => `"${evt.name}", `)}
Listening for events:
webhooks can take upto 5 min to process after authorization 
(^C to quit)
`);
}