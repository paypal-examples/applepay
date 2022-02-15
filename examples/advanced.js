/* eslint-disable  no-alert, no-unused-vars */

const order = {
  purchase_units: [
    {
      payee: {
        merchant_id: "XWVWZ4HG4YH9N",
      },
      amount: {
        currency_code: "USD",
        value: "24.97",
        breakdown: {
          item_total: {
            currency_code: "USD",
            value: "19.99",
          },
          tax_total: {
            currency_code: "USD",
            value: "1.99",
          },
          shipping: {
            currency_code: "USD",
            value: "2.99",
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
            id: "SHIP_123",
            label: "1-3 Day Shipping",
            type: "SHIPPING",
            selected: true,
            amount: {
              value: "2.99",
              currency_code: "USD",
            },
          },
          {
            id: "SHIP_456",
            label: "Pick up in Store",
            type: "PICKUP",
            selected: false,
            amount: {
              value: "0.00",
              currency_code: "USD",
            },
          },
        ],
      },
    },
  ],
};

async function caculateShipping({
  shipping_address,
  selected_shipping_option,
}) {
  const res = await fetch("/calculate-shipping", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shipping_address,
      selected_shipping_option,
    }),
  });

  const { taxRate, isShippingTaxable, updatedShippingOptions } =
    await res.json();

  return {
    taxRate,
    updatedShippingOptions,
    isShippingTaxable,
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
      const { amount, shipping } = order.purchase_units[0];

      caculateShipping(data)
        .then(({ taxRate, isShippingTaxable, updatedShippingOptions }) => {
          const itemTotal = parseFloat(amount.breakdown.item_total.value, 10);

          const shippingMethodAmount = parseFloat(
            data.selected_shipping_option.amount.value,
            10
          );

          let taxTotal = parseFloat(taxRate, 10) * itemTotal;

          if (isShippingTaxable) {
            taxTotal =
              parseFloat(taxRate, 10) * (itemTotal + shippingMethodAmount);
          }

          let shippingOptions = shipping.options.map((option) => ({
            ...option,
            selected: option.label === data.selected_shipping_option.label,
          }));

          if (updatedShippingOptions) {
            shippingOptions = updatedShippingOptions;
          }

          const shippingAddress = {
            admin_area_2: data.shipping_address.city,
            admin_area_1: data.shipping_address.state.toUpperCase(),
            postal_code: data.shipping_address.postal_code,
            country_code: data.shipping_address.country_code,
          };

          const amountValue = {
            currency_code: "USD",
            value: (itemTotal + taxTotal + shippingMethodAmount).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: itemTotal.toFixed(2),
              },
              tax_total: {
                currency_code: "USD",
                value: taxTotal.toFixed(2),
              },
              shipping: {
                currency_code: "USD",
                value: shippingMethodAmount.toFixed(2),
              },
            },
          };
          
          fetch(`/orders/${data.orderID}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify([
              // https://developer.paypal.com/api/orders/v2/#orders_patch

              /*
               * Shipping Address
               */
              {
                op: "replace",
                path: "/purchase_units/@reference_id=='default'/shipping/address",
                value: shippingAddress,
              },

              /*
               * Shipping Options
               */
              {
                op: "replace",
                path: "/purchase_units/@reference_id=='default'/shipping/options",
                value: shippingOptions,
              },

              /*
               * Order Amount
               */
              {
                op: "replace",
                path: "/purchase_units/@reference_id=='default'/amount",
                value: amountValue,
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
