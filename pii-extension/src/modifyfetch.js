console.log("PII Firewall injected fetch patch script starting");

const origFetch = window.fetch;
const pendingRequests = new Map();

const systemPrompt = `
            Assist the user with their request.

            Some values that include PII have been redacted and appear in the format:
            {{Redacted: IDENTIFIER-<HASH>}}

            Rules:
            Do NOT attempt to guess or reconstruct the original value.
            Do NOT modify, reformat, or partially repeat the placeholder.
            ALWAYS copy the placeholder exactly as-is in your response.
            Use the placeholders naturally in context when answering.

            Examples:
            User: Send an email to {{Redacted: EMAIL_ADDRESS-183F}} asking if they are available tomorrow.
            Assistant: here's a message you can send: "Hi {{Redacted: EMAIL_ADDRESS-183F}}, Are you available tomorrow? Let me know what time works best."

            User: Summarize this: John's credit card {{Redacted: VISA-ac39}} received two charges after he went to the store for eggs and milk.
            Assistant: John's credit card {{Redacted: VISA-ac39}} was charged twice from his purchases at the store.

            Now assist the user with their request:
            `;

window.addEventListener("message", (event) => {
  if (event.source !== window || event.data?.source !== "contentscript") {
    return;
  }

  if (event.data.type === "redactedText" && pendingRequests.has(event.data.id)) {
    const resolve = pendingRequests.get(event.data.id);
    resolve(event.data.text);
    pendingRequests.delete(event.data.id);
  }
});

// sedn to service worker for redaction
function redact(text) {
  return new Promise((resolve) => {
    const id = Math.random().toString(36).substring(2, 9);
    pendingRequests.set(id, resolve);
    window.postMessage(
      {
        source: "mainpage",
        type: "redactRequest",
        id,
        text
      },
      "*"
    );    
  });
}

//overwrite fetch so we can redact before it goes out
window.fetch = async (...args) => {
  let url = args[0];
  let options = args[1] || {};

  const urlString = String(url);

  //only filtering conversation messages
  if (
    urlString.includes("/backend-anon/f/conversation") && 
    !urlString.includes("/conversation/prepare") && 
    (options.method === "POST" || (url instanceof Request && url.method === "POST"))
  ) {
    try {
      let rawBody = options.body;
      
      if (rawBody) {
        const body = JSON.parse(rawBody);
        const updatedMessages = [];

        for (const msg of body.messages) {
          if (!msg.content || !msg.content.parts) {
            updatedMessages.push(msg);
            continue;
          }
          const updatedParts = [];
          for (let i = 0; i < msg.content.parts.length; i++) {
            const part = msg.content.parts[i];

            if (typeof part === 'string' && part.trim().length > 0) {
              console.log("Original Text:", part);
              const redactedText = await redact(part);
              console.log("Redacted to:", redactedText);
              updatedParts.push(redactedText);
            } else {
              updatedParts.push(part);
            }
          }
          msg.content.parts = updatedParts;
          //building openai complaint messageparts object for the system prompt
          //see https://developers.openai.com/cookbook/examples/how_to_format_inputs_to_chatgpt_models
          if (msg.author?.role === "user") {
            const systemNodeId = crypto.randomUUID(); 
            const baseTime = msg.create_time ? msg.create_time - 0.001 : (Date.now() / 1000) - 0.001;
            const systemMessageNode = {
              id: systemNodeId,
              author: { role: "system" },
              content: {
                content_type: "text",
                parts: [systemPrompt]
              },
              metadata: {
                serialization_metadata: { custom_symbol_offsets: [] }
              },
              create_time: baseTime,
              parent_message_id: msg.parent_message_id || body.parent_message_id || "client-created-root"
            };
            msg.parent_message_id = systemNodeId;
            updatedMessages.push(systemMessageNode);
          }
          updatedMessages.push(msg);
        }
        //overwriting mesage body
        body.messages = updatedMessages;
        const newBodyStr = JSON.stringify(body);
        if (url instanceof Request) {
          args[0] = new Request(url, { body: newBodyStr });
        } else {
          options.body = newBodyStr;
          args[1] = options;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  return origFetch(...args);
};

console.log("overwrote fetch your PII is now protected :)");