import _isObject from 'lodash/isObject';
import _isArray from 'lodash/isArray';
import _cloneDeep from 'lodash/cloneDeep';
import _each from 'lodash/each';
import { BaseComponent } from '../base/Base';
import { FormioComponents } from '../Components';
import { TextFieldComponent } from '../textfield/TextField';

export class StripeComponent extends FormioComponents {
  constructor(component, options, data) {
    super(component, options, data);

    // Get the source for Stripe API
    let src = 'https://js.stripe.com/v3/';
    this.stripeReady = BaseComponent.requireLibrary('stripe', 'Stripe', src, true);
    window.aaaa=this;
  }

  /**
   * Set the value of this component.
   *
   * @param value
   * @param flags
   *
   * @return {boolean} - If the value changed.
   */
  setValue(value, flags) {
    return BaseComponent.prototype.setValue.apply(this, arguments);
  }

  set loading(loading) {
    this.setLoading(this.stripeElementButton, loading);
  }

  set disabled(disabled) {
    super.disabled = disabled;
    this.setDisabled(this.element, disabled);
  }

  paymentPending() {
    this.inputHiddenComponent.setValue("");

    this.addClass(this.element, 'stripe-submitting');
    this.removeClass(this.element, 'stripe-error');
    this.removeClass(this.element, 'stripe-submitted');
    this.stripeElementButton.setAttribute('disabled', 'disabled');
    this.loading = true;
    this.disabled = true;
  }

  paymentDisplayError(result) {
    if (result.error) {
      // Inform the user if there was an error
      let stripeElementErrorBlock = this.ce('p', {
        class: "help-block"
      }, result.error.message);
      this.stripeElementError.innerHTML = '';
      this.stripeElementError.appendChild(stripeElementErrorBlock);
    } else {
      this.stripeElementError.innerHTML = '';
    }
  }

  paymentError(result) {
    this.paymentDisplayError(result);
    this.removeClass(this.element, 'stripe-submitting');
    this.addClass(this.element, 'stripe-submit-error');
    this.removeClass(this.element, 'stripe-submitted');
    this.stripeElementButton.removeAttribute('disabled');
    this.loading = false;
    this.disabled = false;
  }

  paymentDone(result) {
    // Store token in hidden input
    this.inputHiddenComponent.setValue(result.token.id);

    this.removeClass(this.element, 'stripe-submit-error');
    this.removeClass(this.element, 'stripe-submitting');
    this.addClass(this.element, 'stripe-submitted');
    this.loading = false;
    if (this.component.action === 'submit') {
      this.emit('submitButton');
      this.disabled = false;
      this.stripeElementButton.removeAttribute('disabled');
    }
    else {
      this.disabled = true;
      if (this.stripeElementPayButton) {
        this.stripeElementPayButton.style.display = "none";
      }
      this.stripeElementCard.style.display = "none";
    }
  }

  build() {
    this.createElement();

    if (this.component.stripe.payButton && this.component.stripe.payButton.enable) {
      this.stripeElementPayButton = this.ce('div', {
        class: "Stripe-paybutton"
      });
      this.element.appendChild(this.stripeElementPayButton);
    }

    // Create fieldset
    this.fieldset = this.ce('fieldset');
    this.element.appendChild(this.fieldset);

    // Create legend
    this.legendPayButton = this.ce('legend', {
      style: "display: none;"
    }, 'Or enter card details');
    this.legendNoPayButton = this.ce('legend', {}, 'Pay with card');
    this.fieldset.appendChild(this.legendPayButton);
    this.fieldset.appendChild(this.legendNoPayButton);

    // Create container for stripe cart input
    this.stripeElementCard = this.ce('div');
    this.fieldset.appendChild(this.stripeElementCard);

    // Add a hidden input which will contain the payment token.
    this.inputHidden = _cloneDeep(this.component);
    this.inputHidden.type = "hidden";
    this.component.components.unshift(this.inputHidden);

    // Add components
    this.addComponents(this.fieldset);

    // Get hidden input component
    this.inputHiddenComponent = this.getComponent(this.component.key);

    // Add error field for stripe error
    this.stripeElementError = this.ce('div', {
      class: "formio-errors"
    });
    this.fieldset.appendChild(this.stripeElementError);

    // Add stripe pay button
    this.stripeElementButton = this.ce('button', {
      type: 'button',
      class: 'btn btn-primary'
    }, 'Pay');
    this.fieldset.appendChild(this.stripeElementButton);

    this.element.appendChild(this.fieldset);

    this.stripeReady.then(() => {
      let stripe = new Stripe(this.component.stripe.keyId)

      let stripeOptions = {};
      if (this.component.stripe) {
        stripeOptions = this.component.stripe.stripeOptions || {};
      }

      // Create an instance of Elements
      let elements = stripe.elements();

      // Create an instance of the card Element
      let card = elements.create('card', stripeOptions);

      // Add an instance of the card Element into the `card-element` <div>
      card.mount(this.stripeElementCard);

      // Handle real-time validation errors from the card Element.
      this.addEventListener(card, 'change', this.paymentDisplayError.bind(this));

      // Handle button submission
      this.addEventListener(this.stripeElementButton, 'click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.paymentPending();

        let cardData = {};
        let stripeComponentsMapping = this.component.stripe.componentsMapping || {};
        _each(stripeComponentsMapping, (componentKey, stripeKey) => {
          let comp = this.root.getComponent(componentKey);
          if (comp) {
            cardData[stripeKey] = comp.getValue();
          }
        });

        let that = this;
        stripe.createToken(card, cardData).then((result) => {
          if (result.error) {
            this.paymentError(result);
          } else {
            this.paymentDone(result);
          }
        });
      });

      if (this.component.stripe.payButton && this.component.stripe.payButton.enable) {
        let paymentRequest = stripe.paymentRequest(this.component.stripe.payButton.paymentRequest);

        this.addEventListener(paymentRequest, 'token', (result) => {
          this.paymentDone(result);
          result.complete("success");
        });

        let stripeOptionsPayButton = {};
        if (this.component.stripe.payButton) {
          stripeOptionsPayButton = this.component.stripe.payButton.stripeOptions || {};
        }
        stripeOptionsPayButton.paymentRequest = paymentRequest;

        let paymentRequestElement = elements.create("paymentRequestButton", stripeOptionsPayButton);

        paymentRequest.canMakePayment().then((result) => {
          if (result) {
            this.legendNoPayButton.style.display = "none";
            this.legendPayButton.style.display = "block";
            paymentRequestElement.mount(this.stripeElementPayButton);
          }
        });
      }
    });
  }
}
