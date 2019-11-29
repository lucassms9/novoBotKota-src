// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { LuisRecognizer } = require('botbuilder-ai');
const { InputHints, MessageFactory } = require('botbuilder');
const { TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class QnaDialog extends CancelAndHelpDialog {
    constructor(id, luisRecognizer) {
        super(id || 'qnaDialog');

        console.log('constuctor qnaDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.initialStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * verifica se tem alguma ativação
     */
    async initialStep(stepContext) {
        let messageText = '';
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        console.log(LuisRecognizer.topIntent(luisResult))
        switch (LuisRecognizer.topIntent(luisResult)) {
        case 'Ponto_Extra': {
            messageText = 'Ponto Extra tem por objetivo aumentar o giro de um produto através de sua exposição em local de destaque dentro do ponto de venda, em posição diferente da qual geralmente ele é exposto, ou seja, fora da gôndola onde a categoria normalmente está.';
            break;
        }
        case 'Incentivo_de_Vendas': {
            messageText = 'O Incentivo de Vendas opera para aumentar os estoques do ponto de venda, através de volume adicional à média de compras do ponto de venda participante.';
            break;
        }
        case 'Intro_Prod': {
            messageText = 'Introdução de Produto visa promover a distribuição de um produto, que pode ser um lançamento no mercado ou que simplesmente não está em linha em um determinado canal ou ponto de venda.';
            break;
        }
        case 'Suporte_Kotaki': {
            messageText = 'Gustavo Gushiken_ Comercial e Operações \n\n 11 98103 0214_ gustavo.gushiken@kotaki.digital';
            break;
        }
        case 'Objetivo': {
            messageText = 'Para fortalecer você, varejista independente, seu negócio e a comunidade, ajudando a gerar renda, emprego, e dignidade.';
            break;
        }
        case 'Quem_Somos': {
            messageText = 'Empreendedores com muitos anos de experiência em empresas de bens de consumo. Estamos comprometidos em revolucionar o modo como as marcas se relacionam com você !';
            break;
        }
        case 'Oque_Faz': {
            messageText = 'Ajudamos toda a cadeia de abastecimento do varejo a conquistar mais resultados, com soluções digitais inclusivas e eficientes';
            break;
        }
        case 'Como_Funciona': {
            const howWorkEntities = this.luisRecognizer.getHowWorkEntities(luisResult);
            console.log(howWorkEntities);
            if (typeof howWorkEntities === 'undefined') {
                messageText = '01_ marcas parceiras nos contratam para trazer ofertas de atividades promocionais a pontos de venda como o seu.\n\n 02_ você acessa essas ofertas atravésde nosso aplicativo e aceita ou recusa as mesmas, dependendo de seu interesse.\n\n 03_ ao aceitar uma oferta e comprovar que implementou a atividade corretamente, você recebe a verba que a marca ofereceu aos participantes.\n\n 04_ você acessa essa verba na forma de desconto em sua próxima compra da marca, no distribuidor/atacadista que a marca indicou no momento de fazer a oferta.\n\n05_ tudo gratuitamente, de maneira prática e eficiente no seu celular, e contando sempre com a orientação de nosso consultor de negócios.';
            } else {
                messageText = 'Aproximando a indústria e você, através de um aplicativo que viabiliza ativações de marca em seu ponto de venda.';
            }
            break;
        }
        default: {
            messageText = 'Não entendi, desculpa';
            break;
        }
        }
        // request para buscar texto de about
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        return await stepContext.next(stepContext);
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.QnaDialog = QnaDialog;
