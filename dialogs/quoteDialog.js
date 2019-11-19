// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints, MessageFactory } = require('botbuilder');
const { TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class QuoteDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'quoteDialog');

        console.log('constuctor quote');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.quoteStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * verifica se tem alguma ativação
     */
    async quoteStep(stepContext) {
        const aboutDetails = stepContext.options;
        aboutDetails.text = true;
        // request para buscar texto de about
        const messageText = '**QuoteStep a Kotaki** \n\n';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        return await stepContext.next(aboutDetails.text);
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.QuoteDialog = QuoteDialog;
