/* eslint-disable  no-alert, no-unused-vars */

/*
paypal
  .Marks({
    fundingSource: paypal.FUNDING.APPLEPAY,
  })
  .render("#applepay-mark");
*/

const order = {
  purchase_units: [
    {
      payee: {
        merchant_id: "XWVWZ4HG4YH9N",
      },
      amount: {
        currency_code: "USD",
        value: "7.05",
      },
    },
  ],
};


paypal
  .Buttons({
    fundingSource: paypal.FUNDING.APPLEPAY,
    style: {
      label: "pay",
      color: "black",
    },
    createOrder(data, actions) {
      return actions.order.create(order);
    },
    onApprove(data, actions) {
      console.log("Order approved")
      
      return actions.order.capture().then(function (details) {
        console.log(JSON.stringify(details, null, 4))
      });
    },
  })
  .render("#applepay-btn");
