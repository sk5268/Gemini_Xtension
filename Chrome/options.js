// Settings page functionality
// Additional settings will be added here later

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

document.addEventListener("DOMContentLoaded", function () {
  const promptTextarea = document.getElementById("prompt-textarea");
  const saveButton = document.getElementById("save-button");
  const resetButton = document.getElementById("reset-button");
  const statusMessage = document.getElementById("status-message");
  const webPromptTextarea = document.getElementById("web-prompt-textarea");
  const saveWebButton = document.getElementById("save-web-button");
  const resetWebButton = document.getElementById("reset-web-button");
  const webStatusMessage = document.getElementById("web-status-message");

  // Load saved prompt or use default
  chrome.storage.sync.get(["customPrompt"], (result) => {
    promptTextarea.value = result.customPrompt || DEFAULT_PROMPT;
    promptTextarea.placeholder = DEFAULT_PROMPT;
  });

  // Load saved webpage prompt or use default
  chrome.storage.sync.get(["customWebPrompt"], (result) => {
    webPromptTextarea.value = result.customWebPrompt || DEFAULT_WEB_PROMPT;
    webPromptTextarea.placeholder = DEFAULT_WEB_PROMPT;
  });

  // Save webpage prompt
  saveWebButton.addEventListener("click", function () {
    const customWebPrompt = webPromptTextarea.value.trim();
    chrome.storage.sync.set(
      {
        customWebPrompt: customWebPrompt,
      },
      () => {
        if (chrome.runtime.lastError) {
          showWebStatusMessage(
            "Error saving webpage prompt: " + chrome.runtime.lastError.message,
            "error",
          );
        } else {
          showWebStatusMessage("Webpage prompt saved successfully!", "success");
        }
      },
    );
  });

  // Reset to default webpage prompt
  resetWebButton.addEventListener("click", function () {
    webPromptTextarea.value = DEFAULT_WEB_PROMPT;
    chrome.storage.sync.remove(["customWebPrompt"], () => {
      if (chrome.runtime.lastError) {
        showWebStatusMessage(
          "Error resetting webpage prompt: " + chrome.runtime.lastError.message,
          "error",
        );
      } else {
        showWebStatusMessage("Webpage prompt reset to default!", "success");
      }
    });
  });

  // Save custom prompt
  saveButton.addEventListener("click", function () {
    const customPrompt = promptTextarea.value.trim();
    chrome.storage.sync.set(
      {
        customPrompt: customPrompt,
      },
      () => {
        if (chrome.runtime.lastError) {
          showStatusMessage(
            "Error saving prompt: " + chrome.runtime.lastError.message,
            "error",
          );
        } else {
          showStatusMessage("Prompt saved successfully!", "success");
        }
      },
    );
  });

  // Reset to default prompt
  resetButton.addEventListener("click", function () {
    promptTextarea.value = DEFAULT_PROMPT;
    chrome.storage.sync.remove(["customPrompt"], () => {
      if (chrome.runtime.lastError) {
        showStatusMessage(
          "Error resetting prompt: " + chrome.runtime.lastError.message,
          "error",
        );
      } else {
        showStatusMessage("Prompt reset to default!", "success");
      }
    });
  });

  function showWebStatusMessage(message, type) {
    webStatusMessage.textContent = message;
    webStatusMessage.className = type;
    webStatusMessage.style.display = "block";

    setTimeout(() => {
      webStatusMessage.style.display = "none";
    }, 3000);
  }

  function showStatusMessage(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = type;
    statusMessage.style.display = "block";

    setTimeout(() => {
      statusMessage.style.display = "none";
    }, 3000);
  }
});
