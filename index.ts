
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
    Json = "Json",
    XML = "XML",
    Image = "Image",
}

class QuoteExtractor {

    private mapBetweenQuoteTypeToRunableFunction = new Map<Quotestypes,Function>();
    constructor(){
        // Have to bind the function in order the function will be familier with the scope (this)
        this.mapBetweenQuoteTypeToRunableFunction.set(Quotestypes.Json,this.getQuotesFromJson.bind(this));
        this.mapBetweenQuoteTypeToRunableFunction.set(Quotestypes.XML,this.getQuotesFromXML.bind(this));
        this.mapBetweenQuoteTypeToRunableFunction.set(Quotestypes.Image,this.getQuotesFromImage.bind(this));
    }
    async getQuotes(quoteTypes:Quotestypes[],page:number, numberOfQuotesPeerPage:number) {
        // validate that each type pas only once
        const uniqQuoteType = new Set(quoteTypes);

        let returnQuotes: Quote[] = [];
        for(let quoteType of uniqQuoteType){
            const runableFunctionToGetQuotes = this.mapBetweenQuoteTypeToRunableFunction.get(quoteType);
            if(runableFunctionToGetQuotes){
                returnQuotes = returnQuotes.concat(await runableFunctionToGetQuotes());
            }
        }

        // Validate the page and the numberOfQuotesPerrPage
        const parsedNumberOfQuetesPerPage = +numberOfQuotesPeerPage;
        if(isNaN(parsedNumberOfQuetesPerPage)){
            numberOfQuotesPeerPage = returnQuotes.length;
        }
        // Validate the page and the numberOfQuotesPerrPage
        if (numberOfQuotesPeerPage > returnQuotes.length || numberOfQuotesPeerPage < 1){
            numberOfQuotesPeerPage = returnQuotes.length;
        }
        const parsePage = +page;
        if(isNaN(parsePage)){
            page = 1
        }
        if (page === undefined || page < 1){
            page = 1
        }
        const maxPages = Math.floor(returnQuotes.length/numberOfQuotesPeerPage)
        if (page > maxPages){
            page = maxPages;
        }
        if (numberOfQuotesPeerPage)
        console.log("***************" + page + "***************" + numberOfQuotesPeerPage);
        // return only the reuested page and number of quotes for the specific page
        return returnQuotes.slice((page-1)*numberOfQuotesPeerPage,page*numberOfQuotesPeerPage);
    }

    private validatePage(page:number){
        
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
        parseString(xml, { explicitArray: false }, (error, result) => {
            
            if (!error) {
                responseFromParse = <Quote[]>result.root.quote;
            }
        });
        return responseFromParse;
    }

    async getQuotesFromImage() {
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
    const returnQuotes = await quoteExtractor.getQuotes([Quotestypes.Json,Quotestypes.Json],0,0);

    console.log(returnQuotes);
}

main();

