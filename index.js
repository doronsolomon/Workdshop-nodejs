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
    Quotestypes[Quotestypes["Json"] = 0] = "Json";
    Quotestypes[Quotestypes["XML"] = 1] = "XML";
    Quotestypes[Quotestypes["Image"] = 2] = "Image";
})(Quotestypes || (Quotestypes = {}));
class QuoteExtractor {
    constructor() {
        this.mapBetweenQuoteTypeToRunableFunction = new Map();
        this.mapBetweenQuoteTypeToRunableFunction.set(Quotestypes.Json, this.getQuotesFromJson);
        this.mapBetweenQuoteTypeToRunableFunction.set(Quotestypes.XML, this.getQuotesFromXML);
        this.mapBetweenQuoteTypeToRunableFunction.set(Quotestypes.Image, this.getQuoFromImage);
    }
    getQuotes(quoteTypes, page, numberOfQuotesPeerPage) {
        return __awaiter(this, void 0, void 0, function* () {
            let returnQuotes = [];
            for (let quoteType of quoteTypes) {
                const runableFunctionToGetQuotes = this.mapBetweenQuoteTypeToRunableFunction.get(quoteType);
                if (runableFunctionToGetQuotes) {
                    console.log(yield runableFunctionToGetQuotes());
                    //returnQuotes = returnQuotes.concat(runableFunctionToGetQuotes());
                }
            }
            /*const jsonQuotePromise = this.getQuotesFromJson();
            const xmlQuotePromise = this.getQuotesFromXML();
            const imageQuotePromise = this.getQuoFromImage();
            const [jsonQuote, xmlQuote, imageQuote] = await Promise.all([jsonQuotePromise, xmlQuotePromise, imageQuotePromise]);
            */
            return returnQuotes;
        });
    }
    getQuotesFromJson() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get('https://dimkinv.github.io/node-workshop/json-source.json');
                const data = response.data;
                return data;
            }
            catch (error) {
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
                console.log(data);
                const dataCovertToJSON = this.convertFromXMLToJson(data);
                return dataCovertToJSON;
            }
            catch (error) {
                console.log("something went wrong with getting quote from XML API");
                return [];
            }
        });
    }
    convertFromXMLToJson(xml) {
        console.log("doron1");
        console.log(xml);
        const parseString = xml2js_1.default.parseString;
        let responseFromParse = [];
        parseString(xml, { explicitArray: false }, function (error, result) {
            if (!error) {
                responseFromParse = result.root.quote;
            }
        });
        return responseFromParse;
    }
    getQuoFromImage() {
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
                const response = yield axios_1.default.post('https://vision.googleapis.com/v1/images:annotate?key=AIzaSyDJTmcSD6ZUUMBzSvHp8s4OdSUHYuZzyQc', body);
                const data = response.data;
                return data;
            }
            catch (error) {
                console.log("something went wrong with getting text from image API");
                throw new Error("something went wrong with getting text from image API");
            }
        });
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const quoteExtractor = new QuoteExtractor();
        const returnQuotes = yield quoteExtractor.getQuotes([Quotestypes.Image], 2, 2);
        //console.log(returnQuotes);
    });
}
main();
