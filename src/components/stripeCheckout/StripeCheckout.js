import _isObject from 'lodash/isObject';
import _isArray from 'lodash/isArray';
import _cloneDeep from 'lodash/cloneDeep';
import _each from 'lodash/each';
import { BaseComponent } from '../base/Base';
import { ButtonComponent } from '../button/Button';

export class StripeCheckoutComponent extends ButtonComponent {
  constructor(component, options, data) {
    super(component, options, data);

    // Get the source for Stripe API
    let src = 'https://checkout.stripe.com/checkout.js';
    this.stripeCheckoutReady = BaseComponent.requireLibrary('stripeCheckout', 'StripeCheckout', src, true);
    window.cccc=this;
  }

  onToken(token) {
    this.inputHiddenComponent.setValue(token.id);
    // In case of submit, submit the form
    if (this.componentAction === 'submit') {
      this.emit('submitButton');
    }
  }

  onClickButton(value) {
    // Open Checkout with further options:
    let configurationOpen = this.component.stripe.configurationOpen || {};

    if (this.componentAction === 'submit') {
      // In case of submit, validate the form before opening button
      if (this.root.isValid(value.data, true)) {
        this.handler.open(configurationOpen);
      }
    }
    else {
      this.handler.open(configurationOpen);
    }
  }

  build() {
    // Keep action
    this.componentAction = this.component.action;

    // Force button to handle event action on click
    this.component.action = "event";

    // Build button
    super.build();

    // Add a hidden input which will contain the payment token.
    this.inputHidden = _cloneDeep(this.component);
    this.inputHidden.type = "hidden";
    this.root.addComponent(this.inputHidden);

    // Get hidden input component
    this.inputHiddenComponent = this.root.getComponent(this.component.key);

    this.stripeCheckoutReady.then(() => {
      let configuration = this.component.stripe.configuration || {};
      configuration.key = this.component.stripe.apiKey;
      configuration.token = this.onToken.bind(this);

      this.handler = StripeCheckout.configure(configuration);

      this.on('customEvent', this.onClickButton.bind(this));

      this.addEventListener(window, 'popstate', (event) => {
        this.handler.close();
      });
    });
  }
}
