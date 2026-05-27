import { redactor } from "./ReplacementLogic/PIIRedactor.js";


//initialize ner model
function warmUpModel() {
  redactor.RedactText("test string").then(() => {
  }).catch(err => console.error(err));
}
warmUpModel();

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  //redact text and return it
  if (msg.type === "redactText") {
    redactor.RedactText(msg.text)
      .then((redacted) => {
        respond({ text: redacted });
      })
    return true;
  }
  //return dict of redactions mapped to true vals
  if (msg.type === "getredactdict") {
      const dict = redactor.Getredactiondict();
      respond({ dict: dict ?? {} });
  }
});
