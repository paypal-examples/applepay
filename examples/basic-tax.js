/* eslint-disable  no-alert, no-unused-vars */

const order = {
  purchase_units: [
    {
      payee: {
        merchant_id: "XWVWZ4HG4YH9N",
      },
      amount: {
        currency_code: "USD",
        value: "1.20",
        breakdown: {
          item_total: {
            currency_code: "USD",
            value: "1.00",
          },
          tax_total: {
            currency_code: "USD",
            value: "0.20",
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
      },
      method: "USPS",
      options: [
        {
          id: "1",
          amount: {
            currency_code: "USD",
            value: "1.00",
          },
          type: "SHIPPING",
          label: "Basic Shipping",
          selected: true,
        },
      ],
    },
  ],
};

async function caculateShipping(shippingAddress) {
  console.log("Tax update for postcode %s", shippingAddress.postal_code);

  return {
    // random sales tax rate 0 - 10%
    taxRate: (Math.random() * 10).toFixed(2),
  };
}

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
      caculateShipping(data.shipping_address)
        .then(({ taxRate }) => {
          fetch(`/orders/${data.orderID}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify([
              {
                op: "replace",
                path: "/purchase_units/@reference_id=='default'/amount",
                value: {
                  currency_code: "USD",
                  value: "1.30",
                  breakdown: {
                    item_total: {
                      currency_code: "USD",
                      value: "1.00",
                    },
                    tax_total: {
                      currency_code: "USD",
                      value: "0.30",
                    },
                  },
                },
              },
            ]),
          })
            .then((res) => {
              if (!res.ok) {
                throw new Error("patching order");
              }
              return res.json();
            })
            .then((json) => {
              console.log(
                `Successful Order patch call: ${JSON.stringify(json)}`
              );
              return actions.resolve();
            })
            .catch((err) => {
              return actions.reject(err);
            });
        })
        .catch(console.error);
    },
  })
  .render("#applepay-btn");


