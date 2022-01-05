/* eslint-disable  no-alert, no-unused-vars */

const amount = {
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

const shippingOptions = [
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
];

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
      const decimal = (strValue) => parseFloat(strValue, 10);

      const { orderID, selected_shipping_option } = data;

      const {
        breakdown: { item_total, tax_total },
      } = amount;

      console.log(JSON.stringify({ data, item_total, tax_total }, null, 4));

      let itemTotal = decimal(item_total.value);
      let taxAmount = decimal(tax_total.value);

      let shippingMethodAmount = decimal("0.00");

      if (selected_shipping_option?.amount?.value) {
        shippingMethodAmount = decimal(selected_shipping_option.amount.value);

        data.selected_shipping_option.selected = true;
      }

      data.amount.value = (
        itemTotal +
        taxAmount +
        shippingMethodAmount
      ).toFixed(2);

      const body = JSON.stringify([
        {
          op: "replace",
          path: "/purchase_units/@reference_id=='default'/amount",
          value: data.amount,
        },
      ]);

      return fetch(`/orders/${orderID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body,
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
