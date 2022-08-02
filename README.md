# Applepay

See a [hosted version](https://applepay-paypal-js-sdk.herokuapp.com) of the sample


Currently in beta






`paymentRequest.applepay` 

Config options

- [requiredShippingContactFields](https://developer.apple.com/documentation/apple_pay_on_the_web/applepaypaymentrequest/2216121-requiredshippingcontactfields)

- [shippingContact](https://developer.apple.com/documentation/apple_pay_on_the_web/applepaypayment/1916097-shippingcontact)


#### Examples

#### Collect Shipping Contact Fields
```
paypal
    .Buttons({
        style: {
            label: "pay"
        },
        paymentRequest: {
            applepay: {
                requiredShippingContactFields: [
                    "postalAddress", 
                    "name", 
                    "phone", 
                    "email"
                ]
            },
        },
        createOrder(data, actions) {
            return actions.order.create(order);
        },
        onApprove(data, actions) {},
    })
    .render("#btn");
```



#### No Shipping
```
paypal
    .Buttons({
        style: {
            label: "pay"
        },
        paymentRequest: {
            applepay: {
                requiredShippingContactFields: [],
            },
        },
        createOrder(data, actions) {
            return actions.order.create(order);
        },
        onApprove(data, actions) {

        },
        onError(err) {
            logResponse("Error", err)
        },
        onCancel() {
            logResponse("onCancel", {})
        }
    })
    .render("#btn");
```

#### Shipping Contact prefill
```
paypal
    .Buttons({
        style: {
            label: "pay"
        },
        paymentRequest: {
            applepay: {
                requiredShippingContactFields: [
                    "postalAddress", 
                    "name", 
                    "phone", 
                    "email"
                ],
                shippingContact: {
                    locality: "Cupertino",
                    country: "United States",
                    postalCode: "95014-2083",
                    administrativeArea: "CA",
                    emailAddress: "ravipatel@example.com",
                    familyName: "Patel",
                    addressLines: ["1 Infinite Loop"],
                    givenName: "Ravi",
                    countryCode: "US",
                    phoneNumber: "(408) 555-5555",
                },
            },
        },
        createOrder(data, actions) {
            return actions.order.create(order);
        },
        onApprove(data, actions) {},
    })
    .render("#btn");
```

#### DigitalGoods
```
paypal
    .Buttons({
        style: {
            label: "pay"
        },
        paymentRequest: {
            applepay: {
                requiredShippingContactFields: [
                   "email"
                ]
            },
        },
        createOrder(data, actions) {
            return actions.order.create(order);
        },
        onApprove(data, actions) {},
    })
    .render("#btn");
```


#### Full Shipping Collection - onShippingChange
- Address Change
- Shipping Option Change
- Tax / Amount Update

```
const order = {
  purchase_units: [
    {
      amount: {
        currency_code: 'USD',
        value: '13.00',
        breakdown: {
          item_total: {
            currency_code: 'USD',
            value: '10.00',
          },
          tax_total: {
            currency_code: 'USD',
            value: '1.00',
          },
          shipping: {
            currency_code: 'USD',
            value: '2.00',
          },
        },
      },
      shipping: {
        options: [
          {
            id: 'SHIP_123',
            label: '1-3 Day',
            type: 'SHIPPING',
            selected: true,
            amount: {
              value: '2.00',
              currency_code: 'USD',
            },
          },
          {
            id: 'SHIP_456',
            label: '3-6 Day',
            type: 'SHIPPING',
            selected: false,
            amount: {
              value: '1.00',
              currency_code: 'USD',
            },
          },
        ],
      },
    },
  ],
}

async function calculateShipping(shippingAddress) {
  const res = await fetch('/calculate-shipping', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shippingAddress,
    }),
  })

  const { taxRate } = await res.json()

  return {
    taxRate,
  }
}

paypal
  .Buttons({
    fundingSource: paypal.FUNDING.APPLEPAY,
    style: {
      label: 'pay',
      color: 'black',
    },
    paymentRequest: {
      applepay: {
        requiredShippingContactFields: [
          'postalAddress',
          'name',
          'phone',
          'email',
        ],
      },
    },
    createOrder(data, actions) {
      return actions.order.create(order)
    },
    onError(err) {
      console.error(err)
    },
    async onApprove(data, actions) {
      const res = await fetch(`/capture/${data.orderID}`, {
        method: 'post',
      })
      if (!res.ok) {
        throw new Error('capture failed')
      }
    },
    async onShippingChange(data, actions) {
      const { amount, shipping } = order.purchase_units[0]

      const { taxRate } = await calculateShipping(data.shipping_address)

      const itemTotal = parseFloat(amount.breakdown.item_total.value)

      const shippingMethodAmount = parseFloat(
        data.selected_shipping_option.amount.value,
      )

      const taxTotal = parseFloat(taxRate) * itemTotal

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
      }

      const shippingOptions = (shipping?.options || []).map((option) => ({
        ...option,
        selected: option.id === data.selected_shipping_option.id,
      }))

      const res = await fetch(`/orders/${data.orderID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          // https://developer.paypal.com/api/orders/v2/#orders_patch
          {
            op: 'replace',
            path: "/purchase_units/@reference_id=='default'/shipping/options",
            value: shippingOptions,
          },
          {
            op: 'replace',
            path: "/purchase_units/@reference_id=='default'/amount",
            value: purchaseUnitsAmount,
          },
        ]),
      })

      if (!res.ok) {
        throw new Error('patching order')
      }
      return actions.resolve()
    },
  })
  .render('#applepay-btn')

```
