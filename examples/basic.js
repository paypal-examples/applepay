/* eslint-disable  no-alert, no-unused-vars */

const order = {
  purchase_units: [
    {
      amount: {
        currency_code: 'USD',
        value: '0.01',
      },
    },
  ],
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
    async onApprove(data, actions) {
      const res = await fetch(`/capture/${data.orderID}`, {
        method: 'post',
      })
      if (!res.ok) {
        throw new Error('capture failed')
      }
      alert('You will not be charged')
    },
  })
  .render('#applepay-btn')
