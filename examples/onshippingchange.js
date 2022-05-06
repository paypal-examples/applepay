/* eslint-disable  no-alert, no-unused-vars */

const order = {
  purchase_units: [
    {
      amount: {
        currency_code: "USD",
        value: "0.03",
        breakdown: {
          item_total: {
            currency_code: "USD",
            value: "0.01",
          },
          tax_total: {
            currency_code: "USD",
            value: "0.01",
          },
          shipping: {
            currency_code: "USD",
            value: "0.01",
          },
        },
      },
      shipping: {
        options: [
          {
            id: "SHIP_123",
            label: "1-3 Day",
            type: "SHIPPING",
            selected: false,
            amount: {
              value: "0.02",
              currency_code: "USD",
            },
          },
          {
            id: "SHIP_456",
            label: "3-6 Day",
            type: "SHIPPING",
            selected: true,
            amount: {
              value: "0.01",
              currency_code: "USD",
            },
          },
          {
            id: "SHIP_789",
            label: "In Store",
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

async function calculateShipping(shippingAddress) {
  const res = await fetch("/calculate-shipping", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shippingAddress,
    }),
  });

  const { taxRate } = await res.json();

  // based on zipcode change
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
      fetch(`/capture/${data.orderID}`, {
        method: "post",
      })
        .then((res) => res.json())
        .then(() => {
          alert(`Order Capture Success - OrderID ${data.orderID}`);
        })
        .catch((err) => {
          alert(`Order Capture Error - OrderID ${data.orderID}`);
          console.error(err);
        });
    },
    onShippingChange(data, actions) {
      const { amount, shipping } = order.purchase_units[0];

      return calculateShipping(data.shipping_address)
        .then(({ taxRate }) => {
          const itemTotal = parseFloat(amount.breakdown.item_total.value);

          const shippingMethodAmount = parseFloat(
            data.selected_shipping_option.amount.value
          );

          const taxTotal = parseFloat(taxRate) * itemTotal;

          const purchaseUnitsAmount = {
            currency_code: amount.currency_code,
            value: (itemTotal + taxTotal + shippingMethodAmount).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: amount.currency_code,
                value: itemTotal.toFixed(2),
              },
              tax_total: {
                currency_code: amount.currency_code,
                value: taxTotal.toFixed(2),
              },
              shipping: {
                currency_code: amount.currency_code,
                value: shippingMethodAmount.toFixed(2),
              },
            },
          };

          const shippingOptions = (shipping?.options || []).map((option) => ({
            ...option,
            selected: option.label === data.selected_shipping_option.label,
          }));

          return fetch(`/orders/${data.orderID}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            // https://developer.paypal.com/api/orders/v2/#orders_patch
            body: JSON.stringify([
              /*
               * Shipping Options
               */
              {
                op: "replace",
                path: "/purchase_units/@reference_id=='default'/shipping/options",
                value: shippingOptions,
              },

              /*
               * Amount
               */
              {
                op: "replace",
                path: "/purchase_units/@reference_id=='default'/amount",
                value: purchaseUnitsAmount,
              },
            ]),
          })
            .then((res) => {
              if (!res.ok) {
                throw new Error("patching order");
              }
              return actions.resolve();
            })
            .catch((err) => {
              console.error(err);
              return actions.reject(err);
            });
        })
        .catch((err) => {
          console.error(err);
          return actions.reject(err);
        });
    },
  })
  .render("#applepay-btn");
