This is a PII redactor for chatgpt
-It detects and redacts personal information before it goes to openai servers,
-It replaces this ony the frontend for senior user experiences

SETUP:
1. Clone the repo and install dependencies:
git clone https://github.com/harrywhite13/cs312LLMFilterExtension.git
cd .\cs312LLMFilterExtension\
cd .\pii-extension\
npm i

2. Build the extension:
npm run build
(this will make a dist dir inside of the repo)

3. Load the extension into your browser
in your chrome browser go to chrome://extensions/
in the top left go to "load unpacked" -> select the dist dir that was just created inside of the repo
you should now see the PII firewall extension listed

4. Try it out!
go to https://chatgpt.com/
send a message to chatgpt and it should look totally normal
when you send the message the browser console will show the original and redacted text ex

Original Text: hello my name is john doe
Redacted to: hello my name is {{Redacted: PER_9489}}
