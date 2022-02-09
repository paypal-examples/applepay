/* eslint-disable  no-alert, no-unused-vars */

const order2 = {
  purchase_units: [{
      payee: {
        merchant_id: "XWVWZ4HG4YH9N",
      },
      amount: {
          currency_code: 'USD',
          value: '7.05',
          breakdown: {
              item_total: {
                  currency_code: 'USD',
                  value: '1.99'
              },
              tax_total: {
                  currency_code: 'USD',
                  value: '0.07'
              },
              shipping: {
                  currency_code: 'USD',
                  value: '4.99'
              }
          }
      },
      shipping: {
          "address": {
              "shipping_name": "Shipping To Cogny Cogny 69640",
              "phone": "143543778",
              "address_line_1": "33 Rue des Écoles",
              "address_line_2": "",
              "admin_area_1": "Cogny",
              "admin_area_2": "Cogny",
              "postal_code": "69640",
              "country_code": "FR",
              "address_details": {}
          },
          "method": "USPS",
          options: [
              {
                  id: '1',
                  amount: {
                      currency_code: 'USD',
                      value: '0.00'
                  },
                  type: 'SHIPPING',
                  label: 'Free Shipping',
                  selected: false
              },
              {
                  id: '2',
                  amount: {
                      currency_code: 'USD',
                      value: '9.99'
                  },
                  type: 'SHIPPING',
                  label: '1-Day Shipping',
                  selected: false
              },
              {
                  id: '3',
                  amount: {
                      currency_code: 'USD',
                      value: '4.99'
                  },
                  type: 'SHIPPING',
                  label: '3-Day Shipping',
                  selected: true
              }
          ]
      }
  }]
}


// 
const shippingOptions = [
  {
    id: "1",
    amount: {
      currency_code: "USD",
      value: "4.99",
    },
    type: "SHIPPING",
    label: "🚛 Ground Shipping (2 days)",
    selected: true,
  },
  {
    id: "2",
    amount: {
      currency_code: "USD",
      value: "24.99",
    },
    type: "SHIPPING",
    label: "🚀 Drone Express (2 hours)",
    selected: false,
  },
];

const selectedShippingAmount = shippingOptions.find((option) => option.selected).amount;
  
const breakdown = {
  item_total: {
    currency_code: "USD",
    value: "1.99",
  },
  tax_total: {
    currency_code: "USD",
    value: "0.07",
  },
  shipping: selectedShippingAmount,
};

const breakdownTotalValue = Object.values(breakdown)
  .reduce((total, item) => (total += parseFloat(item.value, 10)), 0)
  .toFixed(2)
  .toString();

const amount = {
  currency_code: "USD",
  value: breakdownTotalValue,
  breakdown,
};

const shippingAddress = {
  shipping_name: "John Doe",
  phone: "5109323432",
  address_line_1: "123 Townsend St",
  address_line_2: "Floor 6",
  admin_area_1: "CA",
  admin_area_2: "San Francisco",
  postal_code: "94107",
  country_code: "US",
  address_details: {},
};

const order = {
  purchase_units: [
    {
      payee: {
        merchant_id: "XWVWZ4HG4YH9N",
      },
      amount: amount,
      shipping: {
        address: shippingAddress,
        method: "USPS",
        options: shippingOptions,
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
      console.log("Order approved");

      fetch(`/capture/${data.orderID}`, {
        method: "post",
      })
        .then((res) => res.json())
        .then((data) => {
          alert("order captured");
        })
        .catch(console.error);
    },
    onShippingChange(data, actions) {
      console.log("onShippingChange");
      console.log(JSON.stringify(data, null, 4));

      /*
       * Handle Shipping Address Changes - example shipping to us only
     
      if (data.shipping_address?.country_code !== "us") {
        // https://developer.apple.com/documentation/apple_pay_on_the_web/applepayerrorcode
        // https://developer.apple.com/documentation/apple_pay_on_the_web/applepayerror
        return actions.reject(
          new window.ApplePayError(
            "shippingContactInvalid",
            "countryCode",
            "Sorry we only ship to the US"
          )
        );
      }
  */
 
      /*
       * Handle Shipping Option Update
       */
      return fetch(`/calculate-shipping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("shipping update");
          }
          return res.json();
        })
        .then((json) => {
          console.log(`Successful Order patch call: ${JSON.stringify(json)}`);
          return actions.resolve();
        })
        .catch((err) => {
          console.log("err shiopping update")
          return actions.reject(err);
        });
    },
  })
  .render("#applepay-btn");
