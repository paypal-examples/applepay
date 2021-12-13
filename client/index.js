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
        breakdown: {
          item_total: {
            currency_code: "USD",
            value: "1.99",
          },
          tax_total: {
            currency_code: "USD",
            value: "0.07",
          },
          shipping: {
            currency_code: "USD",
            value: "4.99",
          },
        },
      },
      shipping: {
        address: {
          shipping_name: "Shipping To Cogny Cogny 69640",
          phone: "143543778",
          address_line_1: "33 Rue des Écoles",
          address_line_2: "",
          admin_area_1: "Cogny",
          admin_area_2: "Cogny",
          postal_code: "69640",
          country_code: "FR",
          address_details: {},
        },
        method: "USPS",
        options: [
          {
            id: "1",
            amount: {
              currency_code: "USD",
              value: "0.00",
            },
            type: "SHIPPING",
            label: "Free Shipping",
            selected: false,
          },
          {
            id: "2",
            amount: {
              currency_code: "USD",
              value: "9.99",
            },
            type: "SHIPPING",
            label: "1-Day Shipping",
            selected: false,
          },
          {
            id: "3",
            amount: {
              currency_code: "USD",
              value: "4.99",
            },
            type: "SHIPPING",
            label: "3-Day Shipping",
            selected: true,
          },
        ],
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
      return actions.order.capture().then(function (details) {
        alert(`Transaction completed by ${details.payer.name.given_name}!`);
      });
    },
  })
  .render("#applepay-btn");
