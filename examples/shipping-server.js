/* eslint-disable  no-alert, no-unused-vars */

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
          shipping_name: "John Doe",
          phone: "5109323432",
          address_line_1: "123 Townsend St",
          address_line_2: "Floor 6",
          admin_area_1: "CA",
          admin_area_2: "San Francisco",
          postal_code: "94107",
          country_code: "US",
          address_details: {},
        },
        method: "USPS",
        options: [
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
      fetch(`/calculate-shipping`, {
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
          console.log(JSON.stringify(json, null, 4))
          console.log(`Successful Order patch call: ${JSON.stringify(json)}`);
          return actions.resolve();
        })
        .catch((err) => {
          console.log("err shiopping update");
          return actions.reject(err);
        });
    },
  })
  .render("#applepay-btn");
