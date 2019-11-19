// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class ActivationDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'activationDialog');

        console.log('constuctor activation');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT, false, 'pt-br'))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.findActivation.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * verifica se tem alguma ativação
     */
    async findActivation(stepContext) {
        const activationDetails = stepContext.options;

        // request para buscat ativacoes
        const messageText = 'ok, você esta participando da ativação Bolachas Marel.';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        return await stepContext.next(activationDetails.ativa);
    }

    /**
     * Confirm the information the user has provided. 
     */
    async confirmStep(stepContext) {
        const activationDetails = stepContext.options;

        // Capture the results of the previous step
        activationDetails.ativa = stepContext.result;
        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, 'você quer receber notificações?', ['sim', 'nao']);
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const messageText = 'Combinado, no dia 18/nov você receberá um Lembrete.';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
            return await stepContext.endDialog(stepContext);
        }
        return await stepContext.endDialog();
    }
}

module.exports.ActivationDialog = ActivationDialog;
