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


  const order = await getOrder(orderRes.id);

  const body = [
    {
      op: "replace",
      path: "/purchase_units/@reference_id=='default'/amount",
      value: {
        currency_code: "USD",
        value: "7.06",
        breakdown: {
          item_total: {
            currency_code: "USD",
            value: "1.99",
          },
          tax_total: {
            currency_code: "USD",
            value: "0.08", // changed  ....
          },
          shipping: {
            currency_code: "USD",
            value: "4.99",
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
