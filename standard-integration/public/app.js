/* eslint-disable  no-alert, no-unused-vars */

paypal
  .Buttons({
    style: {
      color: "silver",
      shape: "pill",
    },
    createOrder (data) {
      return fetch("/api/orders", {
        method: "POST",
        // use the "body" param to optionally pass additional order information
        // like product ids or amount
      })
        .then((response) => response.json())
        .then((order) => order.id);
    },
    onApprove(data, actions) {
      fetch(`/api/orders/${data.orderID}/capture`, {
        method: "post",
      })
        .then((res) => res.json())
        .then(() => {
          alert(`Order Capture Success - OrderID ${data.orderID}`);
        })
        .catch((err) => {
          alert(`Order Capture Error - OrderID ${data.orderID}`);
          console.error(err)
        });
    }, 
    onError(error) {
      // Do something with the error from the SDK
  }
  })
  .render("#applepay-btn");