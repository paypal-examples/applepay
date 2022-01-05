# Applepay

See a [hosted version](https://applepay-paypal-js-sdk.herokuapp.com) of the sample


### How to run locally

Copy the .env.example file into a file named .env

```
cp .env.example .env
```

and configuring your .env config file with your Paypal ClientId and ClientSecret

1. Clone the repo  `git clone git@github.com:paypal-examples/applepay.git`
2. Run `npm install`
3. Run `npm run dev`







curl -v -X PATCH http://localhost:8080/orders/4P8858363D257290Y \
-H "Content-Type: application/json" \
-d '[
        {
          "op": "replace",
          "path": "/purchase_units/@reference_id=='default'/amount",
          "value": {
            "currency_code": "USD",
            "value": "99.00",
          }
        },
      ]'