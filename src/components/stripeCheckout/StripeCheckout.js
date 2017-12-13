import _isObject from 'lodash/isObject';
import _isArray from 'lodash/isArray';
import _cloneDeep from 'lodash/cloneDeep';
import _each from 'lodash/each';
import { BaseComponent } from '../base/Base';
import { ButtonComponent } from '../button/Button';

// Stripe Checkout can only have one handler for all buttons
let StripeCheckoutHandler;

export class StripeCheckoutComponent extends ButtonComponent {
  constructor(component, options, data) {
    super(component, options, data);

    // Get the source for Stripe API
    let src = 'https://checkout.stripe.com/checkout.js';
    this.stripeCheckoutReady = BaseComponent.requireLibrary('stripeCheckout', 'StripeCheckout', src, true);

    // Keep action
    this.componentAction = this.component.action;

    // Force button to handle event action to build button
    this.component.action = "event";
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
    let configurationOpen = value.component.stripe.configurationOpen || {};
    console.log(configurationOpen);

    if (this.componentAction === 'submit') {
      // In case of submit, validate the form before opening button
      if (this.root.isValid(value.data, true)) {
        StripeCheckoutHandler.open(configurationOpen);
      }
    }
    else {
      StripeCheckoutHandler.open(configurationOpen);
    }
  }

  build() {
    // Build button
    super.build();

    // In case of submit, add event listeners
    if (this.componentAction === 'submit') {
      this.on('submitButton', () => {
        this.loading = true;
        this.disabled = true;
      }, true);
      this.on('submitDone', () => {
        this.loading = false;
        this.disabled = false;
      }, true);
      this.on('change', (value) => {
        this.loading = false;
        this.disabled = (this.component.disableOnInvalid && !this.root.isValid(value.data, true));
      }, true);
      this.on('error', () => {
        this.loading = false;
      }, true);
    }

    // Add a hidden input which will contain the payment token.
    this.inputHidden = _cloneDeep(this.component);
    this.inputHidden.type = "hidden";
    this.inputHidden.key += "_token";
    this.root.addComponent(this.inputHidden);

    // Get hidden input component
    this.inputHiddenComponent = this.root.getComponent(this.inputHidden.key);

    // When stripe checkout is ready, create the handler and add event listeners
    this.stripeCheckoutReady.then(() => {
      if (!StripeCheckoutHandler) {
        let configuration = this.component.stripe.configuration || {};
        configuration.key = this.component.stripe.apiKey;
        configuration.token = this.onToken.bind(this);

        StripeCheckoutHandler = StripeCheckout.configure(configuration);
      }

      this.on('customEvent', this.onClickButton.bind(this));

      this.addEventListener(window, 'popstate', (event) => {
        StripeCheckoutHandler.close();
      });
    });
  }
}
