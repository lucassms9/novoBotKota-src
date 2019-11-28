// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { MessageFactory } = require('botbuilder');
const { DialogBot } = require('./dialogBot');

class DialogAndWelcomeBot extends DialogBot {
    constructor(conversationState, userState, dialog) {
        super(conversationState, userState, dialog);

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                console.log(membersAdded[cnt].id)
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Como posso te ajudar?');
                    await dialog.run(context, conversationState.createProperty('DialogState'));
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async sendSuggestedActions(turnContext) {
       
    }
}

module.exports.DialogAndWelcomeBot = DialogAndWelcomeBot;