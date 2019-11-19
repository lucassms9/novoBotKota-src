// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints, MessageFactory } = require('botbuilder');
const { TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class AboutDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'aboutDialog');

        console.log('constuctor about');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.aboutStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * verifica se tem alguma ativação
     */
    async aboutStep(stepContext) {
        const aboutDetails = stepContext.options;
        aboutDetails.text = true;
        // request para buscar texto de about
        const messageText = '**Sobre a Kotaki** \n\n Acreditamos que a integração do varejo independente é uma necessidade atual e relevante! Sabemos disso por experiência própria. Estamos há muito tempo envolvidos com todas as engrenagens do modelo existente e, temos a consciência de que: os varejistas enfrentam dificuldades para ter preços competitivos e verdadeira capacitação para trabalhar na evolução sustentável de suas lojas; os atacados e distribuidores que os atendem não atingem autonomia, escala e margens suficientes para desempenharem suas funções com eficiência; e as marcas despejam quantidades crescentes de investimentos nos pontos de venda, sem a segurança de que os recursos chegam onde e como, estrategicamente, deveriam ser aplicados.';
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

module.exports.AboutDialog = AboutDialog;
