import CreditCardRecognizerClass from "./Recognizers/RegexRecognizers/CreditCardRecognizer.js";
import CryptoRecognizerClass from "./Recognizers/RegexRecognizers/CryptoRecognizer.js";
import DateRecognizerClass from "./Recognizers/RegexRecognizers/DateRecognizer.js";
import EmailRecognizerClass from "./Recognizers/RegexRecognizers/EmailRecognizer.js";
import IBANRecognizerClass from "./Recognizers/RegexRecognizers/IBANRecognizer.js";
import IpRecognizerClass from "./Recognizers/RegexRecognizers/IPRecognizer.js";
import PhoneRecognizerClass from "./Recognizers/RegexRecognizers/PhoneRecognizer.js";
import UrlRecognizerClass from "./Recognizers/RegexRecognizers/URLRecognizer.js";
import NERRecognizer from "./Recognizers/NerRecognizer/NerRecognizer.js";
import CryptoJS from "crypto-js";

class PIIRedactor{
    constructor(){
        this.regexdetectors = [
            new CreditCardRecognizerClass(),
            new CryptoRecognizerClass(),
            new DateRecognizerClass(),
            new IBANRecognizerClass(),
            new IpRecognizerClass(),
            new PhoneRecognizerClass(),
            new UrlRecognizerClass()
        ];
        this.ner = new NERRecognizer();
        this.redactedvalues = {}
        }

        async RedactText(text){
            //regex matches
            this.regexdetectors.forEach(detector => {
                const matches = detector.recognize(text);
                matches.forEach(match => {
                    //replace vals
                    const entitytype = match.entity
                    const value = match.match
                    const hash = CryptoJS.SHA256(value).toString();;
                    const tag = `{{Redacted: ${entitytype}_${hash.slice(0, 4)}}}`;
                    text = text.replaceAll(value, tag);
                    // save redacted val
                    this.redactedvalues[tag] = value
                });
            });
            //ner matches
            const nerMatches = await this.ner.ReplacePII(text);
            nerMatches.forEach(match => {
                //replace vals
                const entitytype = match.entity
                const value = match.text
                const hash = CryptoJS.SHA256(value).toString();;
                const tag = `{{Redacted: ${entitytype}_${hash.slice(0, 4)}}}`;
                text = text.replaceAll(value, tag);
                // save redacted val
                this.redactedvalues[tag] = value
            });
            return text
        }

        UnredactText(redactedtext){
            for (const [key, value] of Object.entries(this.redactedvalues)){
                redactedtext = redactedtext.replaceAll(key, value);
            }
            return redactedtext;
        }

        Getredactiondict(){
            return this.redactedvalues
        }

    }

export const redactor = new PIIRedactor();