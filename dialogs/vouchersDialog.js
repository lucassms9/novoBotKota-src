// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const api = require('axios');
const { SERVER_URL } = require('../config/Constantes');
const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class VouchersDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'vouchersDialog');

        console.log('constuctor vouchers');
        this.vouchersList = [];
        this.productsSelected = 'productsSelected';

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT, false, 'pt-br'))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.getVouchersStep.bind(this),
                this.showVoucherStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * verifica se tem alguma ativação
     */
    async getVouchersStep(stepContext) {
        // Create a prompt message.
        const vouchers = [];
        const voucherList = [];
        const token = stepContext.context._activity.from.token;

        // set the headers
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                client: 'kotaki-app-retailer'
            }
        };
        const { data: { result } } = await api.get(`${SERVER_URL}/company/vouchers`, config);
        result.vouchers.map((voucher) => {
            vouchers.push(`${voucher.redeemLocal}`);
            this.vouchersList.push(voucher);
        })

        if (vouchers.length > 0) {
            let plu = (vouchers.length === 1) ? 'voucher disponível' : 'vouchers disponíveis';

            var reply = MessageFactory.suggestedActions(vouchers, `Voce tem ${vouchers.length} ${plu}, escolha para ler as instruções`);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: reply });
        } else {
            const messageText = 'Voce nao tem voucher disponiveis';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
            return await stepContext.next(voucherList);
        }
    }

    async showVoucherStep(stepContext) {
        if (this.vouchersList.length === 0) {
            return await stepContext.next();
        }
        const name_local = stepContext.result;
        const messageText = `Orientações para resgate de seu crédito no ${name_local}** \n\n 1) Realize sua compra normalmente, em uma loja ${name_local} de sua preferência; \n\n2) No momento de passar os produtos pelo caixa, basta avisar ao operador que utilizará um cupom digital de desconto;\n\n3) Em seguida, é só fornecer o número do cupom e imediatamente o desconto é concedido.\n\nPor favor esteja atento, pois esse crédito:\n\n1) É pessoal e intransferível; somente você ou alguém de sua confiança deverá ter acesso a ele e realizar sua utilização;\n\n2) Tem validade de 30 dias corridos ;\n\n3) Somente poderá ser utilizado em compras que totalizem R$ 101,00 ou mais.\n\nCaso tenha qualquer dúvida sobre como lidar corretamente com o cupom digital, por favor fale conosco pelo whatsapp (11) 95347-0016.\n\nObrigado pela parceria e boas compras para o seu estabelecimento!\n\n`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        return await stepContext.next();
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
}

module.exports.VouchersDialog = VouchersDialog;
