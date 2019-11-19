// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class QuoteDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'quoteDialog');

        console.log('constuctor quote');

        this.productsSelected = 'productsSelected';

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT, false, 'pt-br'))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.quoteStep.bind(this),
                this.confirmContinueStep.bind(this),
                this.loopStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * verifica se tem alguma ativação
     */
    async quoteStep(stepContext) {
        const list = Array.isArray(stepContext.options) ? stepContext.options : [];
        stepContext.values[this.productsSelected] = list;
        console.log(list)
        // Create a prompt message.
        let messageText = '';
        if (list.length === 0) {
            messageText = 'Muito bem, vamos começar. \n\n Entre com o nome do primeiro produto ou escaneie o cógido de barras';
        } else {
            messageText = 'Entre com o nome do produto ou escaneie o cógido de barras';
        }
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }

    async confirmContinueStep(stepContext) {
        //reques para validar se o produto existe
        const product = stepContext.result;

        const list = stepContext.values[this.productsSelected];
        // console.log()
        list.push(product);

        stepContext.values[this.productsSelected] = list;
        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, 'Deseja adicionar mais produtos ?', ['sim', 'nao']);
    }

    async loopStep(stepContext) {
        const result = stepContext.result;
        const list = stepContext.values[this.productsSelected];
        if (!result) {
            //request para enviar os produtos para o back end
            return await stepContext.next(stepContext);
        }

        return await stepContext.replaceDialog('quoteDialog', list);

    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        const list = stepContext.values[this.productsSelected];
        console.log(list)
        const messageText = 'Certo! vou enviar sua lista para nossos sistemas e em breve retornaremos com as melhorias';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        return await stepContext.endDialog(list);
    }
}

module.exports.QuoteDialog = QuoteDialog;
