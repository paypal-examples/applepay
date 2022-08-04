/* eslint-disable  no-alert, no-unused-vars */

const order = {
  purchase_units: [
    {
      amount: {
        currency_code: 'USD',
        value: '120.00',
        breakdown: {
          item_total: {
            currency_code: 'USD',
            value: '100.00',
          },
          tax_total: {
            currency_code: 'USD',
            value: '10.00',
          },
          shipping: {
            currency_code: 'USD',
            value: '10.00',
          },
        },
      },
      shipping: {
        options: [
          {
            id: 'SHIP_123',
            label: '1-3 Day Shipping',
            type: 'SHIPPING',
            selected: true,
            amount: {
              value: '10.00',
              currency_code: 'USD',
            },
          },
          {
            id: 'SHIP_456',
            label: '3-6 Day Shipping',
            type: 'SHIPPING',
            selected: false,
            amount: {
              value: '5.00',
              currency_code: 'USD',
            },
          },
          {
            id: 'SHIP_789',
            label: 'In Store Pickup',
            type: 'PICKUP',
            selected: false,
            amount: {
              value: '0.00',
              currency_code: 'USD',
            },
          },
        ],
      },
    },
  ],
}

async function calculateShipping(shippingAddress) {
  const { postal_code, country_code, state, city } = shippingAddress

  // Merchant implemented service, returns updated taxRate and shipping options
  // based on postal code update
  const res = await fetch('/calculate-shipping', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      postal_code,
      country_code,
      state,
      city,
    }),
  })

  const { updatedTaxRate, updatedShippingOptions } = await res.json()

  return {
    updatedTaxRate,
    updatedShippingOptions,
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
        /*shippingContact: {
          locality: 'Cupertino',
          country: 'United States',
          postalCode: '95014-2083',
          administrativeArea: 'CA',
          emailAddress: 'ravipatel@example.com',
          familyName: 'Patel',
          addressLines: ['1 Infinite Loop'],
          givenName: 'Ravi',
          countryCode: 'US',
          phoneNumber: '(408) 555-5555',
        },*/
      },
    },
    createOrder(data, actions) {
      return actions.order.create(order)
    },
    async onApprove(data, actions) {
      const res = await fetch(`/capture/${data.orderID}`, {
        method: 'post',
      })
      if (!res.ok) {
        throw new Error('capture failed')
      }
      alert('You will not be charged')
    },
    async onShippingChange(data, actions) {
      const { amount, shipping } = order.purchase_units[0]

      const {
        updatedTaxRate,
        updatedShippingOptions,
      } = await calculateShipping(data.shipping_address)

      const itemTotal = parseFloat(amount.breakdown.item_total.value)

      let shippingMethodAmount = parseFloat(
        data.selected_shipping_option.amount.value,
      )

      const taxTotal = parseFloat(updatedTaxRate) * itemTotal

      let shippingOptions = (shipping?.options || []).map((option) => ({
        ...option,
        selected: option.id === data.selected_shipping_option.id,
      }))

      await fetch(`/orders/${data.orderID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            op: 'replace',
            path: "/purchase_units/@reference_id=='default'/shipping/options",
            value: shippingOptions,
          },
          {
            op: 'replace',
            path: "/purchase_units/@reference_id=='default'/amount",
            value: {
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
            },
          },
        ]),
      })
    },
  })
  .render('#applepay-btn')
