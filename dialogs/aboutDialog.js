// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints, MessageFactory } = require('botbuilder');
const { TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { QnaDialog } = require('./qnaDialog');
const { BotKotakiRecognizer } = require('./botKotakiRecognizer');

const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const QNA_DIALOG = 'qnaDialog';

class AboutDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'aboutDialog');

        console.log('constuctor about');

        const { LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env;
        const luisConfig = { applicationId: LuisAppId, endpointKey: LuisAPIKey, endpoint: `https://${ LuisAPIHostName }` };
        const luisRecognizer = new BotKotakiRecognizer(luisConfig);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new QnaDialog(QNA_DIALOG, luisRecognizer))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.aboutStep.bind(this),
                this.typeDialogStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * verifica se tem alguma ativação
     */
    async aboutStep(stepContext) {
        const messageText = 'Por favor, Entre com a sua dúvida';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }

    async typeDialogStep(stepContext) {
        const message = stepContext.result;
        return await stepContext.beginDialog(QNA_DIALOG, { message });
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.AboutDialog = AboutDialog;
