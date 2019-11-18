
import axios from 'axios';
import xml2js from 'xml2js';

interface Quote {
    content: string;
}


interface OCRREsponse {
    responses: {
        textAnnotations: {
            locale: string;
            description: string;
        }[]
    }[]
}

enum Quotestypes {
    Json,
    XML,
    Image,
}

class QuoteExtractor {

    private mapBetweenQuoteTypeToRunableFunction = new Map<Quotestypes,Function>();
    constructor(){
        // Have to bind the function in order the function will be familier with the scope (this)
        let getQuotesFromJson: Function  = this.getQuotesFromJson.bind(this);
        let getQuotesFromXML: Function = this.getQuotesFromXML.bind(this);
        let getQuoFromImage: Function = this.getQuoFromImage.bind(this);
        this.mapBetweenQuoteTypeToRunableFunction.set(Quotestypes.Json,getQuotesFromJson);
        this.mapBetweenQuoteTypeToRunableFunction.set(Quotestypes.XML,getQuotesFromXML);
        this.mapBetweenQuoteTypeToRunableFunction.set(Quotestypes.Image,getQuoFromImage);
    }
    async getQuotes(quoteTypes:Quotestypes[],page:number, numberOfQuotesPeerPage:number) {
        let returnQuotes: Quote[] = [];
        for(let quoteType of quoteTypes){
            const runableFunctionToGetQuotes = this.mapBetweenQuoteTypeToRunableFunction.get(quoteType);
            if(runableFunctionToGetQuotes){
                returnQuotes = returnQuotes.concat(await runableFunctionToGetQuotes());
            }
        }
        // return only the reuested page and number of quotes for the specific page
        return returnQuotes.slice((page-1)*numberOfQuotesPeerPage,page*numberOfQuotesPeerPage);
    }
    async getQuotesFromJson() {
        try {
            const response = await axios.get<Quote[]>('https://dimkinv.github.io/node-workshop/json-source.json');
            const data = response.data;
            return data;
        } catch (error) {
            console.log(error);
            console.log("something went wrong with getting quote from json API");
            return [];
        }
    }

    async getQuotesFromXML() {
        try {
            const response = await axios.get<string>('https://dimkinv.github.io/node-workshop/xml-source.xml');
            const data = response.data;
            const dataCovertToJSON = this.convertFromXMLToJson(data);
            return dataCovertToJSON;
        } catch (error) {
            console.log(error);
            console.log("something went wrong with getting quote from XML API");
            return [];
        }
    }

    convertFromXMLToJson(xml: string): Quote[] {
        const parseString = xml2js.parseString;
        let responseFromParse: Quote[] = [];
        parseString(xml, { explicitArray: false }, function (error, result) {
            if (!error) {
                responseFromParse = <Quote[]>result.root.quote;
            }
        });
        return responseFromParse;
    }

    async getQuoFromImage() {
        try {
            const response = await axios.get<Quote[]>('https://dimkinv.github.io/node-workshop/image-source.json');
            const data = response.data;

            const returnQuotes: Quote[] = [];
            for (const quote of data) {
                const ocrResponse = await this.getTextFromImage(quote.content);
                let newQuote: Quote = { content: ocrResponse.responses[0].textAnnotations[0].description };
                returnQuotes.push(newQuote);
            }
            return returnQuotes;
        } catch (error) {
            console.log(error);
            console.log("something went wrong with getting quote from image API");
            return [];
        }
    }

    async getTextFromImage(base64: string) {
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
            const response = await axios.post<OCRREsponse>('https://vision.googleapis.com/v1/images:annotate?key=<Your_Key>', body);
            const data = response.data;
            return data;
        } catch (error) {
            console.log(error);
            console.log("something went wrong with getting text from image API");
            throw new Error("something went wrong with getting text from image API");
        }
    }
}


async function main() {

    const quoteExtractor = new QuoteExtractor();
    const returnQuotes = await quoteExtractor.getQuotes([Quotestypes.Json],1,5);

    console.log(returnQuotes);
}

main();

