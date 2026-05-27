let RedactedValues = {};

// Replace placeholders in visible ChatGPT output on the screen
function unredactVisibleText(root = document.body) {
  const keys = Object.keys(RedactedValues);
  if (!keys.length || !root) return;

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        return keys.some(key => node.nodeValue.includes(key))
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  for (const node of textNodes) {
    let text = node.nodeValue;
    for (const [tag, originalValue] of Object.entries(RedactedValues)) {
      text = text.replaceAll(tag, originalValue);
    }
    node.nodeValue = text;
  }
}

// Keep replacing tags as ChatGPT dynamically streams text onto the screen
const unredactObserver = new MutationObserver(mutations => {
  if (!chrome.runtime?.id) {
    unredactObserver.disconnect();
    return;
  }

  for (const mutation of mutations) {
    if (mutation.type === "characterData") {
      unredactVisibleText(mutation.target.parentNode);
    }

    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        unredactVisibleText(node.parentNode);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        unredactVisibleText(node);
      }
    }
  }
});

function syncDictionary() {
  if (!chrome.runtime?.id) return;

  chrome.runtime.sendMessage({ type: "getredactdict" }, (response) => {
    if (chrome.runtime.lastError) return; 
    
    if (response?.dict) {
      RedactedValues = response.dict;
      unredactVisibleText(); 
    }
  });
}
//init replacement onscreen
function startObserving() {
  if (!document.body) {
    document.addEventListener("DOMContentLoaded", startObserving);
    return;
  }

  unredactObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  syncDictionary();
}

//handler for replacement to call backend
window.addEventListener("message", (event) => {
  if (event.source !== window || event.data?.source !== "mainpage") {
    return;
  }

  const detail = event.data;
  if (detail.type === "redactRequest") {
    //send to background pocess for redaction
    chrome.runtime.sendMessage(
      { type: "redactText", id: detail.id, text: detail.text },
      (response) => {
        if (chrome.runtime.lastError) return;

        window.postMessage(
          {
            source: "contentscript",
            type: "redactedText",
            id: detail.id,
            text: response?.text ?? detail.text
          },
          "*"
        );
        
        syncDictionary();
      }
    );
  }
});

startObserving();