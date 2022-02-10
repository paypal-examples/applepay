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

async function caculateShipping(shippingAddress) {
  // random sales tax rate 0 - 10%
  const taxRate = ((Math.random() * 10) / 100).toFixed(2);

  console.log(
    "Fake Sales Tax update %s % for postcode %s",
    (parseFloat(taxRate, 10) * 100).toFixed(2),
    shippingAddress.postal_code
  );

  return {
    taxRate,
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
      const { breakdown } = order.purchase_units[0].amount;

      caculateShipping(data.shipping_address)
        .then(({ taxRate }) => {
          const itemTotal = parseFloat(breakdown.item_total.value, 10);
          const taxAmount = parseFloat(taxRate, 10) * itemTotal;

          const defaultShipping = order.purchase_units[0].shipping.options.find(
            (option) => option.selected
          );

          let shippingMethodAmount = parseFloat(
            defaultShipping.amount.value,
            10
          );

          if (data.selected_shipping_option?.amount?.value) {
            shippingMethodAmount = parseFloat(
              data.selected_shipping_option.amount.value,
              10
            );

            data.selected_shipping_option.selected = true;
          }

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
                  value: (itemTotal + taxAmount + shippingMethodAmount).toFixed(
                    2
                  ),
                  breakdown: {
                    item_total: {
                      currency_code: "USD",
                      value: itemTotal.toFixed(2),
                    },
                    tax_total: {
                      currency_code: "USD",
                      value: taxAmount.toFixed(2),
                    },
                    shipping: {
                      currency_code: "USD",
                      value: shippingMethodAmount.toFixed(2),
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
