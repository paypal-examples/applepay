/* eslint-disable  no-alert, no-unused-vars */

const order = {
  purchase_units: [
    {
      amount: {
        currency_code: "USD",
        value: "120.00",
      }
    },
  ],
};


paypal
  .Buttons({
    style: {
      color: "silver",
      shape: "pill",
    },
    createOrder(data, actions) {
      return actions.order.create(order);
    },
    onApprove(data, actions) {
      fetch(`/capture/${data.orderID}`, {
        method: "post",
      })
        .then((res) => res.json())
        .then(() => {
          console.log(`Order capture success - Order ID ${data.orderID}`);
        })
        .catch((err) => {
          console.error(err)
        });
    }
  })
  .render("#applepay-btn");
