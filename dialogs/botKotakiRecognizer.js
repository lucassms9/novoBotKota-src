// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { LuisRecognizer } = require('botbuilder-ai');

class BotKotakiRecognizer {
    constructor(config) {
        const luisIsConfigured = config && config.applicationId && config.endpointKey && config.endpoint;
        if (luisIsConfigured) {
            this.recognizer = new LuisRecognizer(config, {}, true);
        }
    }

    get isConfigured() {
        return (this.recognizer !== undefined);
    }

    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    async executeLuisQuery(context) {
        return await this.recognizer.recognize(context);
    }

    getQuoteEntities(result) {
        // console.log(result);
        let suporte;
        if (result.entities.$instance.Cotacao) {
            suporte = result.entities.$instance.Cotacao[0].text;
        }
        return suporte;
    }
    getContactEntities(result) {
        console.log(result);
        let suporte;
        if (result.entities.$instance.Suporte) {
            suporte = result.entities.$instance.Suporte[0].text;
        }
        return suporte;
    }
    getAboutEntities(result) {
        console.log(result);
        let about;
        if (result.entities.$instance.Sobre) {
            about = result.entities.$instance.Sobre[0].text;
        }
        return about;
    }

    getAtivaEntities(result) {
        let ativa;
        if (result.entities.$instance.Ativacao) {
            ativa = result.entities.$instance.Ativacao[0].text;
        }
        return ativa;
    }

    getPlaceEntities(result) {
        let place;
        if (result.entities.$instance.Place) {
            place = result.entities.$instance.Place[0].text;
        }
        return place;
    }

    getFromEntities(result) {
        let fromValue, fromAirportValue;
        if (result.entities.$instance.From) {
            fromValue = result.entities.$instance.From[0].text;
        }
        if (fromValue && result.entities.From[0].Airport) {
            fromAirportValue = result.entities.From[0].Airport[0][0];
        }

        return { from: fromValue, airport: fromAirportValue };
    }

    getToEntities(result) {
        let toValue, toAirportValue;
        if (result.entities.$instance.To) {
            toValue = result.entities.$instance.To[0].text;
        }
        if (toValue && result.entities.To[0].Airport) {
            toAirportValue = result.entities.To[0].Airport[0][0];
        }

        return { to: toValue, airport: toAirportValue };
    }

    /**
     * This value will be a TIMEX. And we are only interested in a Date so grab the first result and drop the Time part.
     * TIMEX is a format that represents DateTime expressions that include some ambiguity. e.g. missing a Year.
     */
    getTravelDate(result) {
        const datetimeEntity = result.entities.datetime;
        if (!datetimeEntity || !datetimeEntity[0]) return undefined;

        const timex = datetimeEntity[0].timex;
        if (!timex || !timex[0]) return undefined;

        const datetime = timex[0].split('T')[0];
        return datetime;
    }

    getWeatherDate(result) {
        const datetimeEntity = result.entities.datetime;
        if (!datetimeEntity || !datetimeEntity[0]) return undefined;

        const timex = datetimeEntity[0].timex;
        if (!timex || !timex[0]) return undefined;

        const datetime = timex[0].split('T')[0];
        return datetime;
    }

}

module.exports.BotKotakiRecognizer = BotKotakiRecognizer;