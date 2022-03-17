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

/*
 * Calculate shipping
 */
async function calculateShipping(shipping_address, selected_shipping_option) {
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
    async onShippingChange(data, actions) {
      const { shipping_address, selected_shipping_option, orderID } = data;
      const { amount, shipping } = order.purchase_units[0];

      const { taxRate, isShippingTaxable, updatedShippingOptions } =
        await calculateShipping(shipping_address, selected_shipping_option);

      const itemTotal = parseFloat(amount.breakdown.item_total.value);

      const shippingMethodAmount = parseFloat(
        data.selected_shipping_option.amount.value,
        10
      );

      let taxTotal = parseFloat(taxRate) * itemTotal;

      if (isShippingTaxable) {
        taxTotal = parseFloat(taxRate) * (itemTotal + shippingMethodAmount);
      }

      let shippingOptions = shipping.options.map((option) => ({
        ...option,
        selected: option.label === data.selected_shipping_option.label,
      }));

      if (updatedShippingOptions) {
        shippingOptions = updatedShippingOptions;
      }

      const amountValue = {
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

      await fetch(`/orders/${orderID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          // https://developer.paypal.com/api/orders/v2/#orders_patch

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
      });

      return actions.resolve();
    },
  })
  .render("#applepay-btn");
