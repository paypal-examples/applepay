const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const { getAccessToken } = require("../server/paypal");
const { PAYPAL_API_BASE } = require("../server/config");

async function createOrder() {
  const { access_token } = await getAccessToken();

  const { data } = await axios({
    url: `${PAYPAL_API_BASE}/v2/checkout/orders`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    data: {
      intent: "CAPTURE",
      purchase_units: [
        {
          payee: {
            merchant_id: "2V9L63AM2BYKC",
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
    },
  });

  return data;
}

async function getOrder(id) {
  const { access_token } = await getAccessToken();

  const { data } = await axios({
    url: `${PAYPAL_API_BASE}/v2/checkout/orders/${id}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  });

  return data;
}

async function main() {
  // CREATE order
  console.log("--- create -----");
  const orderRes = await createOrder();
  console.log(JSON.stringify(orderRes, null, 4));

  const data = {
    amount: {
      currency_code: "USD",
      value: "0.00",
    },
    orderID: "2R054996TS7668052",
    shipping_address: {
      city: "San Jose",
      state: "CA",
      country_code: "US",
      postal_code: "12345",
    },
    selected_shipping_option: {
      label: "🚀 Drone Express (2 hours)",
      type: "SHIPPING",
      amount: {
        currency_code: "USD",
        value: "24.99",
      },
    },
    facilitatorAccessToken:
      "A21AAJGJY3dnmPy8qcyR4UiWN4Xs4QsrKflZYlVHxmDEHJ0GFr1RhCM3jc-4kFit8AL_CJHDH7hmO7XiEOCj81ULKjOwhvGtA",
    partnerAttributionID: "APPLEPAY",
  };

  const order = await getOrder(orderRes.id);

  /*
   * Handle Shipping Option Update
   */
  const {
    breakdown: { item_total, tax_total },
  } = order.purchase_units[0].amount;

  const { shipping } = order.purchase_units[0]

  const itemTotal = parseFloat(item_total.value, 10);
  const taxAmount = parseFloat(tax_total.value, 10);

  let shippingMethodAmount = parseFloat("0.00", 10);

  if (data.selected_shipping_option.amount?.value) {
    shippingMethodAmount = parseFloat(
      data.selected_shipping_option.amount.value,
      10
    );

    data.selected_shipping_option.selected = true;
  }

  data.amount.value = (itemTotal + taxAmount + shippingMethodAmount).toFixed(2);

  console.log(
    JSON.stringify(
      {
        currency_code: "USD",
        value: data.amount.value.toString(),
        breakdown: {
          item_total: {
            currency_code: "USD",
            value: itemTotal.toString(),
          },
          tax_total: {
            currency_code: "USD",
            value: taxAmount.toString(),
          },
          shipping: {
            currency_code: "USD",
            value: shippingMethodAmount.toString(),
          },
        },
      },
      null,
      4
    )
  );

  const body = [
    {
      op: "replace",
      path: "/purchase_units/@reference_id=='default'/shipping/options",
      value: shipping.options.map(option => ({
        ...option,
        selected: option.label === data.selected_shipping_option.label
      })),
    },
    /*
     * PATCH Address
     */
    {
      op: "replace",
      path: "/purchase_units/@reference_id=='default'/shipping/address",
      value: {
        address_line_1: "123 UPDATED",
        address_line_2: "Floor 6 UPDATED",
        admin_area_2: "San Francisco UPDATED",
        admin_area_1: "CA",
        postal_code: "12345",
        country_code: "US",
      },
    },
    /*
     * PATCH Amount
     */
    {
      op: "replace",
      path: "/purchase_units/@reference_id=='default'/amount",
      value: {
        currency_code: "USD",
        value: data.amount.value,
        breakdown: {
          item_total: {
            currency_code: "USD",
            value: itemTotal.toString(),
          },
          tax_total: {
            currency_code: "USD",
            value: taxAmount.toString(),
          },
          shipping: {
            currency_code: "USD",
            value: shippingMethodAmount.toString(),
          },
        },
      },
    },
  ];

  // PATCH order
  console.log("--- patch ----");
  const { access_token } = await getAccessToken();

  const { data: patchData } = await axios({
    url: `${PAYPAL_API_BASE}/v2/checkout/orders/${order.id}`,
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    data: body,
  });

  console.log("--- patch ---");
  console.log(JSON.stringify(patchData, null, 4));

  // GET order
  console.log("--- GET ---");
  console.log(JSON.stringify(await getOrder(order.id), null, 4));
}

main().catch((err) => console.log(err.response.data));
