// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class WeatherDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'weatherDialog');
        console.log('constuctor weather');
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.placeStep.bind(this),
                this.dateStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async placeStep(stepContext) {
        const weatherDetails = stepContext.options;

        if (!weatherDetails.place) {
            const messageText = 'To what place for yout forecast?';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(weatherDetails.place);
    }

    async dateStep(stepContext) {
        const weatherDetails = stepContext.options;

        weatherDetails.place = stepContext.result;
        if (!weatherDetails.weatherDate) {
            const messageText = 'To what date for yout forecast?';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(weatherDetails.weatherDate);
    }
   
  
    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        let weatherDetails = { ...stepContext.options, type: 'weather' };

        return await stepContext.endDialog(weatherDetails);
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.WeatherDialog = WeatherDialog;