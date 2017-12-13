export const component = {
  "input": true,
  "tableView": true,
  "label": "stripe",
  "key": "stripe",
  "placeholder": "",
  "multiple": false,
  "protected": false,
  "clearOnHide": true,
  "unique": false,
  "persistent": true,
  "stripe": {
    "keyId": "",
    "payButton": {
      "enable": false,
      "paymentRequest": {},
      "stripeOptions": {}
    },
    "fields": ["name", "adress_line1", "address_city", "address_state", "address_country"],
    "stripeOptions": {}
  },
  "validate": {
    "required": true
  },
  "type": "stripe",
  "tags": [

  ],
  "conditional": {
    "show": "",
    "when": null,
    "eq": ""
  }
};
