/* eslint-disable  no-alert, no-unused-vars */

function totalValue(breakdown) {
  return Object.values(breakdown)
    .reduce((acc, curr) => (acc += parseFloat(curr.value, 10)), 0)
    .toFixed(2)
    .toString();
}

function shippingAmount(shippingOptions) {
  return shippingOptions.find((option) => option.selected).amount;
}

const shippingOptions = [
  {
    id: "1",
    amount: {
      currency_code: "USD",
      value: "0.00",
    },
    type: "SHIPPING",
    label: "🆓 Free Shipping (5 days)",
    selected: false,
  },
  {
    id: "2",
    amount: {
      currency_code: "USD",
      value: "9.99",
    },
    type: "SHIPPING",
    label: "🚛 Ground Shipping (2 days)",
    selected: false,
  },
  {
    id: "3",
    amount: {
      currency_code: "USD",
      value: "24.99",
    },
    type: "SHIPPING",
    label: "🚀 Drone Express (2 hours)",
    selected: true,
  },
];

const breakdown = {
  item_total: {
    currency_code: "USD",
    value: "1.99",
  },
  tax_total: {
    currency_code: "USD",
    value: "0.07",
  },
  shipping: shippingAmount(shippingOptions),
};

const amount = {
  currency_code: "USD",
  value: totalValue(breakdown),
  breakdown: breakdown,
};

const shippingAddress = {
  shipping_name: "Shipping To Cogny Cogny 69640",
  phone: "143543778",
  address_line_1: "33 Rue des Écoles",
  address_line_2: "",
  admin_area_1: "Cogny",
  admin_area_2: "Cogny",
  postal_code: "69640",
  country_code: "FR",
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

      return actions.order.capture().then(function (details) {
        alert(`Transaction completed by ${details.payer.name.given_name}!`);
      });
    },
    onShippingChange(data, actions) {
      console.log("onShippingChange");
      console.log(JSON.stringify(data, null, 4))

      const { orderID, selected_shipping_option } = data;
      const {
        breakdown: { item_total, tax_total },
      } = amount;

      const itemTotal = parseFloat(item_total.value, 10);
      const taxAmount = parseFloat(tax_total.value, 10);

      let shippingMethodAmount = parseFloat("0.00", 10);

      if (selected_shipping_option?.amount?.value) {
        shippingMethodAmount = parseFloat(
          selected_shipping_option.amount.value,
          10
        );

        data.selected_shipping_option.selected = true;
      }

      data.amount.value = (
        itemTotal +
        taxAmount +
        shippingMethodAmount
      ).toFixed(2);

      return fetch(`/orders/${orderID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            op: "replace",
            path: "/purchase_units/@reference_id=='default'/amount",
            value: data.amount,
          },
        ]),
      })
        .then((result) => result.json())
        .then((json) => {
          console.log(`Successful Order patch call: ${JSON.stringify(json)}`);
          return actions.resolve();
        })
        .catch((err) => {
          return actions.reject(err);
        });
    },
  })
  .render("#applepay-btn");
