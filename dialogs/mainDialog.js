// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { MessageFactory, InputHints } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, bookingDialog, weatherDialog, activationDialog, aboutDialog, contactDialog, quoteDialog, vouchersDialog) {
        super('MainDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        if (!bookingDialog) throw new Error('[MainDialog]: Missing parameter \'bookingDialog\' is required');
        if (!activationDialog) throw new Error('[MainDialog]: Missing parameter \'activationDialog\' is required');
        if (!aboutDialog) throw new Error('[MainDialog]: Missing parameter \'aboutDialog\' is required');
        if (!contactDialog) throw new Error('[MainDialog]: Missing parameter \'contactDialog\' is required');
        if (!quoteDialog) throw new Error('[MainDialog]: Missing parameter \'quoteDialog\' is required');
        if (!vouchersDialog) throw new Error('[MainDialog]: Missing parameter \'vouchersDialog\' is required');

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(quoteDialog)
            .addDialog(vouchersDialog)
            .addDialog(activationDialog)
            .addDialog(contactDialog)
            .addDialog(aboutDialog)
            .addDialog(weatherDialog)
            .addDialog(bookingDialog)
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * Currently, this expects a booking request, like "book me a flight from Paris to Berlin on march 22"
     * Note that the sample LUIS model will only recognize Paris, Berlin, New York and London as airport cities.
     */
    async introStep(stepContext) {
        if (!this.luisRecognizer.isConfigured) {
            const messageText = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
            await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await stepContext.next();
        }

        return await this.sendSuggestedActions(stepContext);
    }

    async sendSuggestedActions(stepContext) {
        var reply = MessageFactory.suggestedActions(['Fazer uma cotação', 'Status das minhas ativações', 'Dúvidas sobre a Kotaki', 'Falar com suporte'], 'Como posso ajudar? Segue algumas opções');
        return await stepContext.prompt('TextPrompt', { prompt: reply });
    }

    /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
     */
    async actStep(stepContext) {
        const bookingDetails = {};
        const weatherDetails = {};
        const aboutDetails = {};
        const contactDetails = {};
        const activationDetails = {};
        const quoteDetails = {};

        if (!this.luisRecognizer.isConfigured) {
            // LUIS is not configured, we just run the BookingDialog path.
            return await stepContext.beginDialog('bookingDialog', bookingDetails);
        }

        // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        switch (LuisRecognizer.topIntent(luisResult)) {
        case 'BookFlight': {
            // Extract the values for the composite entities from the LUIS result.
            const fromEntities = this.luisRecognizer.getFromEntities(luisResult);
            const toEntities = this.luisRecognizer.getToEntities(luisResult);

            // Show a warning for Origin and Destination if we can't resolve them.
            await this.showWarningForUnsupportedCities(stepContext.context, fromEntities, toEntities);

            // Initialize BookingDetails with any entities we may have found in the response.
            bookingDetails.destination = toEntities.airport;
            bookingDetails.origin = fromEntities.airport;
            bookingDetails.travelDate = this.luisRecognizer.getTravelDate(luisResult);
            console.log('LUIS extracted these booking details:', JSON.stringify(bookingDetails));

            // Run the BookingDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('bookingDialog', bookingDetails);
        }

        case 'GetWeather': {
            // We haven't implemented the GetWeatherDialog so we just display a TODO message.
            const placeEntities = this.luisRecognizer.getPlaceEntities(luisResult);
            const dateEntities = this.luisRecognizer.getWeatherDate(luisResult);
            weatherDetails.place = placeEntities;
            weatherDetails.weatherDate = dateEntities;

            console.log('LUIS extracted these weather details:', JSON.stringify(weatherDetails));

            // Run the BookingDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('weatherDialog', weatherDetails);
        }
        case 'Status_Ativações': {
            const ativaEntities = this.luisRecognizer.getAtivaEntities(luisResult);
            activationDetails.ativa = ativaEntities;

            console.log('LUIS extracted these activation details:', JSON.stringify(activationDetails));

            // Run the activationDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('activationDialog', activationDetails);
        }
        case 'Qna_Kotaki': {
            const aboutEntities = this.luisRecognizer.getAboutEntities(luisResult);
            aboutDetails.text = aboutEntities;

            console.log('LUIS extracted these about details:', JSON.stringify(aboutDetails));

            // Run the activationDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('aboutDialog', aboutDetails);
        }
        case 'Suporte_Kotaki': {
            const contactEntities = this.luisRecognizer.getContactEntities(luisResult);
            contactDetails.text = contactEntities;

            console.log('LUIS extracted these about details:', JSON.stringify(contactDetails));

            // Run the activationDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('contactDialog', contactDetails);
        }
        case 'Cotacao_Produtos': {
            const quoteEntities = this.luisRecognizer.getQuoteEntities(luisResult);

            console.log('LUIS extracted these about details:', JSON.stringify(quoteDetails));

            // Run the activationDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('quoteDialog', []);
        }
        case 'Vouchers': {
            console.log('LUIS extracted these Vouchers details:');

            // Run the activationDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('vouchersDialog', []);
        }
        default: {
            // Catch all for unhandled intents
            // const didntUnderstandMessageText = `Desculpe, eu não entendi isso. Por favor, tente perguntar de uma maneira diferente (intenção encontrada ${ LuisRecognizer.topIntent(luisResult) })`;
            const didntUnderstandMessageText = `Desculpe, eu não entendi isso.`;
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }
        }

        return await stepContext.next();
    }

    /**
     * Shows a warning if the requested From or To cities are recognized as entities but they are not in the Airport entity list.
     * In some cases LUIS will recognize the From and To composite entities as a valid cities but the From and To Airport values
     * will be empty if those entity values can't be mapped to a canonical item in the Airport.
     */
    async showWarningForUnsupportedCities(context, fromEntities, toEntities) {
        const unsupportedCities = [];
        if (fromEntities.from && !fromEntities.airport) {
            unsupportedCities.push(fromEntities.from);
        }

        if (toEntities.to && !toEntities.airport) {
            unsupportedCities.push(toEntities.to);
        }

        if (unsupportedCities.length) {
            const messageText = `Sorry but the following airports are not supported: ${ unsupportedCities.join(', ') }`;
            await context.sendActivity(messageText, messageText, InputHints.IgnoringInput);
        }
    }

    /**
     * This is the final step in the main waterfall dialog.
     * It wraps up the sample "book a flight" interaction with a simple confirmation.
     */
    async finalStep(stepContext) {
        // If the child dialog ("bookingDialog") was cancelled or the user failed to confirm, the Result here will be null.
        if (stepContext.result) {
            const result = stepContext.result;
            if (result.type === 'weather') {
                const timeProperty = new TimexProperty(result.weatherDate);
                const travelDateMsg = timeProperty.toNaturalLanguage(new Date(Date.now()));
                const msg = `The forecast in  ${ result.place } at ${ travelDateMsg }, its 100 graus.`;
                await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);
            }
        }

        // Restart the main dialog with a different message the second time around
        return await stepContext.replaceDialog(this.initialDialogId, {});
    }
}

module.exports.MainDialog = MainDialog;
