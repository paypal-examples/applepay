/* Development message - remove in prod */
if (!window.ApplePaySession) {
  document.getElementById("applepay-btn").innerText =
    "You must be on safari to view applepay button";
}

var script = document.createElement('script');

script.onload = function() {

  function isMobile() {
    try {
      document.createEvent("TouchEvent");
      return true;
    } catch (e) {
      return false;
    }
  }

  if (!isMobile()) {
    let el = document.createElement("div");
    el.setAttribute("id", "qrcode");
    el.style.position = "fixed"
    el.style.right = "10px"
    el.style.bottom = "10px"
    document.body.appendChild(el);

   new window.QRCode("qrcode", {
      text: window.location.href,
      width: 150,
      height: 150,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.H,
    });
  }

};

script.src = "https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js";
document.getElementsByTagName('head')[0].appendChild(script);
