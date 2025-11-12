const DEFAULT_PROMPT = `Extract and present all information from the video without omitting any detail. Follow these instructions:

1. Go through the entire video thoroughly.
2. Capture and present everything spoken, including definitions, explanations, examples, references, and any background context.
3. Include any on-screen text, slides, charts, or visual elements — describe them clearly if relevant to understanding.
4. Maintain full detail; do not condense or summarize during the main extraction.
5. Organize the output into logical sections based on the flow of the video.
6. Translate any non-English words or phrases if they appear.
7. At the end, write a concise summary (up to 200 words) covering the core message and major takeaways.

Output format:


Title: <Insert video title here if available>

=== Summary ===
<200-word summary of the full video>

===============
Introduction
- ...

Section 1: <Descriptive title>
- ...

Section 2: <Descriptive title>
- ...

...

Conclusion
- ...
`;

const DEFAULT_WEB_PROMPT = `summarize`;

async function getPromptText() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["customPrompt"], (result) => {
      resolve(result.customPrompt || DEFAULT_PROMPT);
    });
  });
}

async function getWebPromptText() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["customWebPrompt"], (result) => {
      resolve(result.customWebPrompt || DEFAULT_WEB_PROMPT);
    });
  });
}

async function getSummarizerService() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["summarizerService"], (result) => {
      resolve(result.summarizerService || "gemini");
    });
  });
}

// Function to check if a URL is a YouTube video URL
function isYouTubeUrl(url) {
  const youtubePatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?/,
    /^https?:\/\/youtu\.be\//,
  ];
  return youtubePatterns.some((pattern) => pattern.test(url));
}

// Process URLs based on their type (YouTube or web page)
async function processAndPasteInGemini(
  urlToProcess,
  promptTextOverride,
  isYoutubeOverride = null,
  originalTabId = null,
) {
  if (!urlToProcess) {
    console.error("Summarizer Extension: No URL provided for processing.");
    return;
  }

  // Determine if it's a YouTube URL if not explicitly specified
  const isYoutube =
    isYoutubeOverride !== null ? isYoutubeOverride : isYouTubeUrl(urlToProcess);

  // Get appropriate prompt text
  const promptText =
    promptTextOverride ||
    (isYoutube ? await getPromptText() : await getWebPromptText());
  const textToPaste = `${urlToProcess}\n\n${promptText}`;

  // For YouTube always use Gemini, for web pages use selected service
  let serviceUrl = "https://gemini.google.com/app";

  if (!isYoutube) {
    const summarizerService = await getSummarizerService();
    switch (summarizerService) {
      case "chatgpt":
        serviceUrl = `https://chatgpt.com/?q=${encodeURIComponent(urlToProcess + "\n\n" + promptText)}`;
        break;
      case "grok":
        serviceUrl = `https://grok.com/?q=${encodeURIComponent(urlToProcess + "\n\n" + promptText)}`;
        break;
      case "gemini":
      default:
        // Keep default serviceUrl
        break;
    }
  }

  chrome.tabs.create({ url: serviceUrl }, (newTab) => {
    if (!newTab || !newTab.id) {
      console.error(
        "Summarizer Extension: Failed to create new tab or get its ID.",
      );
      return;
    }

    function tabUpdateListener(tabId, changeInfo, tab) {
      if (tabId === newTab.id && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(tabUpdateListener);

        setTimeout(() => {
          // Only attempt to paste text for Gemini (YouTube always uses Gemini)
          // ChatGPT and Grok URLs already include the query parameter
          if (serviceUrl === "https://gemini.google.com/app") {
            chrome.tabs.sendMessage(
              newTab.id,
              {
                action: "pasteUrlToActiveElement",
                textToPaste: textToPaste,
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  // Tab may have navigated away or closed
                  console.warn(
                    "Summarizer Extension: Error sending message to tab:",
                    chrome.runtime.lastError.message,
                  );
                } else if (response && response.success) {
                  // Success - switch back to original tab if provided
                  if (originalTabId) {
                    chrome.tabs.update(originalTabId, { active: true });
                  }
                } else {
                  console.warn(
                    "Summarizer Extension: Content script reported pasting was not successful or no suitable element found.",
                    response ? response.reason : "No response details.",
                  );
                }
              },
            );
          } else {
            // For non-Gemini services, switch back to original tab after load
            if (originalTabId) {
              chrome.tabs.update(originalTabId, { active: true });
            }
          }
        }, 500);
      }
    }
    chrome.tabs.onUpdated.addListener(tabUpdateListener);
  });
}

// Listener for browser action (toolbar icon)
chrome.action.onClicked.addListener(async (tab) => {
  let currentTabUrl = tab && tab.url ? tab.url : null;
  if (!currentTabUrl) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        currentTabUrl = tabs[0].url;
      }
    });
  }

  if (!currentTabUrl) {
    console.warn(
      "Summarizer Extension: No current tab URL found. Action aborted.",
    );
    return;
  }

  const isYoutube = isYouTubeUrl(currentTabUrl);
  processAndPasteInGemini(currentTabUrl, null, isYoutube, tab.id);
});

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "summarize-with-ai",
    title: "Summarize with AI",
    contexts: ["link"],
  });
});

// Listener for context menu item click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "summarize-with-ai" && info.linkUrl) {
    const isYoutube = isYouTubeUrl(info.linkUrl);
    processAndPasteInGemini(info.linkUrl, null, isYoutube, tab.id);
  }
});

// Add message listener for content script requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processYouTubeLink" && message.url) {
    processAndPasteInGemini(message.url, null, true, sender.tab.id); // true indicates YouTube URL
    sendResponse({ success: true });
  } else if (message.action === "processWebLink" && message.url) {
    processAndPasteInGemini(message.url, null, false, sender.tab.id); // false indicates non-YouTube URL
    sendResponse({ success: true });
  }
  return true;
});
