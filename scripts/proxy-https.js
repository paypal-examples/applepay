const ngrok = require("ngrok");
const open = require("open");

(async function () {
  let proxyURL;

  try {
    proxyURL = await ngrok.connect(8080);
  } catch (err) {
    console.log(err);
    console.log(`ngrok failed to connect`);
    process.exit(1);
  }

  console.log(proxyURL);
  await open(proxyURL, { app: { name: "safari" } });
})();
