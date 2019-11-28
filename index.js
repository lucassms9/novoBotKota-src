// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// index.js is used to setup and configure your bot

// Import required packages
const path = require('path');
const restify = require('restify');

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, ConversationState, InputHints, MemoryStorage, UserState } = require('botbuilder');

const { BotKotakiRecognizer } = require('./dialogs/botKotakiRecognizer');

// This bot's main dialog.
const { DialogAndWelcomeBot } = require('./bots/dialogAndWelcomeBot');
const { MainDialog } = require('./dialogs/mainDialog');

// the bot's booking dialog
const { BookingDialog } = require('./dialogs/bookingDialog');
const { WeatherDialog } = require('./dialogs/weatherDialog');
const { ActivationDialog } = require('./dialogs/ActivationDialog');
const { AboutDialog } = require('./dialogs/aboutDialog');
const { ContactDialog } = require('./dialogs/contactDialog');
const { QuoteDialog } = require('./dialogs/quoteDialog');
const { VouchersDialog } = require('./dialogs/vouchersDialog');

const BOOKING_DIALOG = 'bookingDialog';
const WEATHER_DIALOG = 'weatherDialog';
const ACTIVATION_DIALOG = 'activationDialog';
const ABOUT_DIALOG = 'aboutDialog';
const CONTACT_DIALOG = 'contactDialog';
const QUOTE_DIALOG = 'quoteDialog';
const VOUCHERS_DIALOG = 'vouchersDialog';

// Note: Ensure you have a .env file and include LuisAppId, LuisAPIKey and LuisAPIHostName.
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    let onTurnErrorMessage = 'O Bot encontrou um erro ou bug.';
    await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
    onTurnErrorMessage = 'Para continuar executando este bot, corrija o código-fonte do bot.';
    await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
    // Clear out state
    await conversationState.delete(context);
};

// Define a state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// If configured, pass in the FlightBookingRecognizer.  (Defining it externally allows it to be mocked for tests)
const { LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env;
const luisConfig = { applicationId: LuisAppId, endpointKey: LuisAPIKey, endpoint: `https://${ LuisAPIHostName }` };

const luisRecognizer = new BotKotakiRecognizer(luisConfig);

// Create the main dialog.
const bookingDialog = new BookingDialog(BOOKING_DIALOG);
const weatherDialog = new WeatherDialog(WEATHER_DIALOG);
const activationDialog = new ActivationDialog(ACTIVATION_DIALOG);
const aboutDialog = new AboutDialog(ABOUT_DIALOG);
const contactDialog = new ContactDialog(CONTACT_DIALOG);
const quoteDialog = new QuoteDialog(QUOTE_DIALOG);
const vouchersDialog = new VouchersDialog(VOUCHERS_DIALOG);
const dialog = new MainDialog(luisRecognizer, bookingDialog, weatherDialog, activationDialog, aboutDialog, contactDialog, quoteDialog, vouchersDialog);

const bot = new DialogAndWelcomeBot(conversationState, userState, dialog);

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3977, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

// Listen for incoming activities and route them to your bot main dialog.
server.post('/api/messages', (req, res) => {
    // Route received a request to adapter for processing
    adapter.processActivity(req, res, async (turnContext) => {
        // route to bot activity handler.
        await bot.run(turnContext);
    });
});
