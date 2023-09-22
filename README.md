# PayPal ApplePay Example Code

Examples from the official [PayPal Developer Docs for ApplePay](https://developer.paypal.com/docs/checkout/apm/apple-pay/).

## Introduction and Overview

This repository contains Integration Example for ApplePay


- [Advanced integration](./advanced-integration/)
  - Build and customize Applepay Integration with the custom Applepay Component


### The PayPal JavaScript SDK

These examples use the [PayPal JavaScript SDK](https://developer.paypal.com/sdk/js/) to display ApplePay checkout button for your buyers

The SDK has several [configuration options](https://developer.paypal.com/sdk/js/configuration/) available. The examples in this repository provide the most minimal example possible to complete a successful transaction.

## Know before you code

### Setup a PayPal Account

To get started with standard checkout, you'll need a developer, personal, or business account.

[Sign Up](https://www.paypal.com/signin/client?flow=provisionUser) or [Log In](https://www.paypal.com/signin?returnUri=https%253A%252F%252Fdeveloper.paypal.com%252Fdeveloper%252Fapplications&intent=developer)

You'll then need to visit the [Developer Dashboard](https://developer.paypal.com/dashboard/) to obtain credentials and to
make sandbox accounts.

### Create an Application

Once you've setup a PayPal account, you'll need to obtain a **Client ID** and **Secret**. [Create a sandbox application](https://developer.paypal.com/dashboard/applications/sandbox/create).

### Have Node.js installed

These examples will ask you to run commands like `npm install` and `npm start`.

You'll need a version of node >= 14 which can be downloaded from the [Node.js website](https://nodejs.org/en/download/).

### Hosted Example
See a [hosted version ](https://applepay-paypal-js-sdk.herokuapp.com)of the sample

## PayPal Codespaces

PayPal codespaces require a client ID and client secret for your app.

### Link to codespaces 

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/paypal-examples/applepay)

### Register codespaces domain
* After your codespaces is ready, copy the codespaces domain URL.
* Login to the [PayPal Sandbox Business Account - Payment methods](https://www.sandbox.paypal.com/businessmanage/account/payments).
* Click on "Manage Apple Pay" link. 
* Click on "Add Domain" button.
* Add your fully qualified codespaces domain in "Add your website" textbox.
* Click on "Register Domain".
* Reload your codespaces.


### Learn more 

You can read more about codespaces in the [PayPal Developer Docs](https://developer.paypal.com/api/rest/sandbox/codespaces).

### Feedback 

* To report a bug or suggest a new feature, create an [issue in GitHub](https://github.com/paypal-examples/paypaldevsupport/issues/new/choose). 
* To submit feedback, go to [GitHub Codespaces](https://developer.paypal.com/api/rest/sandbox/codespaces) and select the "Feedback" tab