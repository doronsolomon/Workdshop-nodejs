"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const xml2js_1 = __importDefault(require("xml2js"));
var Quotestypes;
(function (Quotestypes) {
    Quotestypes["Json"] = "Json";
    Quotestypes["XML"] = "XML";
    Quotestypes["Image"] = "Image";
})(Quotestypes || (Quotestypes = {}));
class QuoteExtractor {
    constructor() {
        this.mapBetweenQuoteTypeToRunableFunction = new Map();
        // Have to bind the function in order the function will be familier with the scope (this)
        this.mapBetweenQuoteTypeToRunableFunction.set(Quotestypes.Json, this.getQuotesFromJson.bind(this));
        this.mapBetweenQuoteTypeToRunableFunction.set(Quotestypes.XML, this.getQuotesFromXML.bind(this));
        this.mapBetweenQuoteTypeToRunableFunction.set(Quotestypes.Image, this.getQuotesFromImage.bind(this));
    }
    getQuotes(quoteTypes, page, numberOfQuotesPeerPage) {
        return __awaiter(this, void 0, void 0, function* () {
            // validate that each type pas only once
            const uniqQuoteType = new Set(quoteTypes);
            let returnQuotes = [];
            for (let quoteType of uniqQuoteType) {
                const runableFunctionToGetQuotes = this.mapBetweenQuoteTypeToRunableFunction.get(quoteType);
                if (runableFunctionToGetQuotes) {
                    returnQuotes = returnQuotes.concat(yield runableFunctionToGetQuotes());
                }
            }
            // Validate the page and the numberOfQuotesPerrPage
            const parsedNumberOfQuetesPerPage = +numberOfQuotesPeerPage;
            if (isNaN(parsedNumberOfQuetesPerPage)) {
                numberOfQuotesPeerPage = returnQuotes.length;
            }
            // Validate the page and the numberOfQuotesPerrPage
            if (numberOfQuotesPeerPage > returnQuotes.length || numberOfQuotesPeerPage < 1) {
                numberOfQuotesPeerPage = returnQuotes.length;
            }
            const parsePage = +page;
            if (isNaN(parsePage)) {
                page = 1;
            }
            if (page === undefined || page < 1) {
                page = 1;
            }
            const maxPages = Math.floor(returnQuotes.length / numberOfQuotesPeerPage);
            if (page > maxPages) {
                page = maxPages;
            }
            if (numberOfQuotesPeerPage)
                console.log("***************" + page + "***************" + numberOfQuotesPeerPage);
            // return only the reuested page and number of quotes for the specific page
            return returnQuotes.slice((page - 1) * numberOfQuotesPeerPage, page * numberOfQuotesPeerPage);
        });
    }
    validatePage(page) {
    }
    getQuotesFromJson() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get('https://dimkinv.github.io/node-workshop/json-source.json');
                const data = response.data;
                return data;
            }
            catch (error) {
                console.log(error);
                console.log("something went wrong with getting quote from json API");
                return [];
            }
        });
    }
    getQuotesFromXML() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get('https://dimkinv.github.io/node-workshop/xml-source.xml');
                const data = response.data;
                const dataCovertToJSON = this.convertFromXMLToJson(data);
                return dataCovertToJSON;
            }
            catch (error) {
                console.log(error);
                console.log("something went wrong with getting quote from XML API");
                return [];
            }
        });
    }
    convertFromXMLToJson(xml) {
        const parseString = xml2js_1.default.parseString;
        let responseFromParse = [];
        parseString(xml, { explicitArray: false }, (error, result) => {
            if (!error) {
                responseFromParse = result.root.quote;
            }
        });
        return responseFromParse;
    }
    getQuotesFromImage() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get('https://dimkinv.github.io/node-workshop/image-source.json');
                const data = response.data;
                const returnQuotes = [];
                for (const quote of data) {
                    const ocrResponse = yield this.getTextFromImage(quote.content);
                    let newQuote = { content: ocrResponse.responses[0].textAnnotations[0].description };
                    returnQuotes.push(newQuote);
                }
                return returnQuotes;
            }
            catch (error) {
                console.log(error);
                console.log("something went wrong with getting quote from image API");
                return [];
            }
        });
    }
    getTextFromImage(base64) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let body = {
                    'requests': [
                        {
                            'image': {
                                'content': base64
                            },
                            'features': [
                                {
                                    'type': 'TEXT_DETECTION'
                                }
                            ]
                        }
                    ]
                };
                const response = yield axios_1.default.post('https://vision.googleapis.com/v1/images:annotate?key=<Your_Key>', body);
                const data = response.data;
                return data;
            }
            catch (error) {
                console.log(error);
                console.log("something went wrong with getting text from image API");
                throw new Error("something went wrong with getting text from image API");
            }
        });
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const quoteExtractor = new QuoteExtractor();
        const returnQuotes = yield quoteExtractor.getQuotes([Quotestypes.Json, Quotestypes.Json], 0, 0);
        console.log(returnQuotes);
    });
}
main();
