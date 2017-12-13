import _isObject from 'lodash/isObject';
import _isArray from 'lodash/isArray';
import _cloneDeep from 'lodash/cloneDeep';
import _each from 'lodash/each';
import { BaseComponent } from '../base/Base';
import { FormioComponents } from '../Components';
import { TextFieldComponent } from '../textfield/TextField';
import { ButtonComponent } from '../button/Button';
import { HiddenComponent } from '../button/Hidden';

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
  }

  onClickButton(event) {
    event.preventDefault();
    // Open Checkout with further options:
    let configurationOpen = this.component.stripe.configurationOpen || {};
    this.handler.open(configurationOpen);
  }

  build() {
    // Add a hidden input which will contain the payment token.
    this.inputHidden = _cloneDeep(this.component);
    this.inputHidden.type = "hidden";
    this.root.addComponent(this.inputHidden);

    // Get hidden input component
    this.inputHiddenComponent = this.getComponent(this.component.key);

    // Force button to handle event action on click
    // this.component.event = "event";

    this.stripeCheckoutReady.then(() => {
      let configuration = this.component.stripe.configuration || {};
      configuration.apiKey = this.component.stripe.apiKey;
      configuration.token = this.onToken;

      this.handler = StripeCheckout.configure(configuration);

      super.build();

      this.on('customEvent', this.onClickButton);

      this.addEventListener(window, 'popstate', (event) => {
        this.handler.close();
      });
    });
  }
}
