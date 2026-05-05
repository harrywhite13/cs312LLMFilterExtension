import CreditCardRecognizerClass from "./Recognizers/RegexRecognizers/CreditCardRecognizer.js";
import CryptoRecognizerClass from "./Recognizers/RegexRecognizers/CryptoRecognizer.js";
import DateRecognizerClass from "./Recognizers/RegexRecognizers/DateRecognizer.js";
import EmailRecognizerClass from "./Recognizers/RegexRecognizers/EmailRecognizer.js";
import IBANRecognizerClass from "./Recognizers/RegexRecognizers/IBANRecognizer.js";
import IpRecognizerClass from "./Recognizers/RegexRecognizers/IPRecognizer.js";
import PhoneRecognizerClass from "./Recognizers/RegexRecognizers/PhoneRecognizer.js";
import UrlRecognizerClass from "./Recognizers/RegexRecognizers/URLRecognizer.js";
import NERRecognizer from "./Recognizers/NerRecognizer/NerRecognizer.js";
import { createHash } from "node:crypto";

const regexdetectors = [
    new CreditCardRecognizerClass(),
    new CryptoRecognizerClass(),
    new DateRecognizerClass(),
    new IBANRecognizerClass(),
    new IpRecognizerClass(),
    new PhoneRecognizerClass(),
    new UrlRecognizerClass()
]

const ner = new NERRecognizer()


async function RedactText(text){
    
    const RedactedValues = {}
    //regex matches
    regexdetectors.forEach(detector => {
        const matches = detector.recognize(text);
        matches.forEach(match => {
            //replace vals
            const entitytype = match.entity
            const value = match.match
            const hash = createHash("sha256").update(value).digest("hex");
            const tag = `{{Redacted: ${entitytype}_${hash.slice(0, 4)} }}`;
            text = text.replaceAll(value, tag);
            
            //save redacted val
            RedactedValues[tag] = value
        });
    });
    

    //ner matches
    const nerMatches = await ner.ReplacePII(text);
    nerMatches.forEach(match => {
        //replace vals
        const entitytype = match.entity
        const value = match.text
        const hash = createHash("sha256").update(value).digest("hex");
        const tag = `{{Redacted: ${entitytype}_${hash.slice(0, 4)} }}`;
        text = text.replaceAll(value, tag)

        //save redacted val
        RedactedValues[tag] = value
    });
    return [text, RedactedValues];
}

function UnredactText(redactedtext, decryptdict){
    for (const [key, value] of Object.entries(decryptdict)){
        redactedtext = redactedtext.replaceAll(key, value);
    }
    return redactedtext;
}

let usertext = "Hello my name is harry white and my birthday is 2/17/2026 I live at northwestern university and my phone number is 484 988 5919 and I like to use https://workspace.google.com/products/drive/"

SYSTEM_PROMPT = `
Assist the user with their request.

Some values that include PII have been redacted and appear in the format:
{{Redacted: IDENTIFIER}}

These placeholders must be treated as exact tokens.

Rules:
- Do NOT attempt to guess or reconstruct the original value.
- Do NOT modify, reformat, or partially repeat the placeholder.
- ALWAYS copy the placeholder exactly as-is in your response.
- Use the placeholders naturally in context when answering.

---

Examples:

User: Send an email to {{Redacted: EMAIL_ADDRESS}} asking if they are available tomorrow.

Assistant: Sure — here's a message you can send:

"Hi {{Redacted: EMAIL_ADDRESS}},
Are you available tomorrow? Let me know what time works best."

---

User: What domain is this email from: {{Redacted: EMAIL_ADDRESS}}?

Assistant: I can't determine the domain from {{Redacted: EMAIL_ADDRESS}} since it has been redacted.

---

User: Summarize this: John's credit card {{Redacted: VISA}} was charged twice.

Assistant: John's credit card {{Redacted: VISA}} was charged twice.

---

User: Replace the phone number with a formatted version: {{Redacted: PHONE_NUMBER}}

Assistant: I can't reformat {{Redacted: PHONE_NUMBER}} because the original number is redacted.

---

User: Create a URL using this domain: {{Redacted: URL}}

Assistant: Here's an example:
https://{{Redacted: URL}}/home

---

Now assist the user with their request.
`;