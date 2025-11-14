// Settings page functionality
// Additional settings will be added here later

// Default summarizer service (Gemini)
const DEFAULT_SUMMARIZER_SERVICE = "gemini";

const DEFAULT_PROMPT = `# Adaptive Video Content Extraction Prompt

Extract and present all information from the video without omitting any detail. Follow these instructions:

## Core Requirements:
1. Go through the entire video thoroughly
2. Capture and present everything spoken, including definitions, explanations, examples, references, and any background context
3. Include any on-screen text, slides, charts, or visual elements — describe them clearly if relevant to understanding
4. Maintain full detail; do not condense or summarize during the main extraction
5. Translate any non-English words or phrases if they appear
6. **Dynamically adapt the output format** based on the video type and content structure

## Format Selection Guidelines:

**For Educational/Tutorial Videos:**
- Use structured sections with clear learning objectives
- Include step-by-step processes
- Highlight key concepts and definitions
- Add practice examples or exercises mentioned

**For Lectures/Academic Content:**
- Organize by main topics and subtopics
- Include theoretical frameworks
- Capture all references and citations
- Note any Q&A or discussion segments

**For News/Documentary Content:**
- Present chronologically or by storyline
- Include factual details, statistics, and sources
- Capture interviews and expert opinions
- Note visual evidence or footage described

**For Entertainment/Narrative Content:**
- Follow story structure or performance flow
- Capture dialogue, scenes, and transitions
- Include cultural references or context
- Note visual/audio elements that enhance meaning

**For Technical/Scientific Videos:**
- Organize by methodology or process steps
- Include all data, measurements, and results
- Capture technical terminology with explanations
- Note diagrams, formulas, or demonstrations

**For Product/Marketing Videos:**
- Structure around features, benefits, and use cases
- Include pricing, specifications, and comparisons
- Capture testimonials and demonstrations
- Note visual branding and key messaging

**For Interview/Podcast Format:**
- Organize by conversation topics or themes
- Capture each speaker's contributions clearly
- Include personal anecdotes and examples
- Note discussion dynamics and key insights

## Output Structure:

**Title:** [Insert video title if available]

**Summary:** [100-200 word overview of core message and major takeaways]

**[Content organized in the most appropriate format for the identified video type]**

## Emoji Usage:
- Add contextually appropriate emojis to all section headings to enhance readability and visual navigation
- Choose emojis that genuinely reflect the content of each section
- Examples: 📚 for educational content, 🎯 for key points, 💡 for insights, 🔬 for scientific content, 🎬 for entertainment, 📊 for data/statistics, ⚙️ for technical processes, 🗣️ for interviews/quotes, ⏱️ for timelines, ✅ for conclusions/takeaways
- Use emojis consistently throughout the document for similar section types

## Additional Notes:
- If the video combines multiple formats, use a hybrid approach that serves the content best
- Always prioritize clarity and logical flow over rigid structure adherence
- Include timestamps if they help with navigation or reference
- Note any significant visual elements that cannot be described in text alone
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
  const serviceStatusMessage = document.getElementById(
    "service-status-message",
  );
  const summarizerRadioButtons =
    document.getElementsByName("summarizer-service");
  const switchBackToggle = document.getElementById("switch-back-toggle");

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

  // Load saved summarizer service or use default
  chrome.storage.sync.get(["summarizerService"], (result) => {
    const service = result.summarizerService || DEFAULT_SUMMARIZER_SERVICE;

    // Set the correct radio button
    for (const radioButton of summarizerRadioButtons) {
      if (radioButton.value === service) {
        radioButton.checked = true;
        break;
      }
    }
  });

  if (switchBackToggle) {
    chrome.storage.sync.get(["switchBackToOriginalTab"], (result) => {
      const storedValue = result.switchBackToOriginalTab;
      const isEnabled = storedValue === undefined ? true : Boolean(storedValue);
      switchBackToggle.checked = isEnabled;
    });

    switchBackToggle.addEventListener("change", function () {
      const newValue = this.checked;
      chrome.storage.sync.set(
        {
          switchBackToOriginalTab: newValue,
        },
        () => {
          if (chrome.runtime.lastError) {
            showServiceStatusMessage(
              "Error saving tab preference: " + chrome.runtime.lastError.message,
              "error",
            );
          } else {
            showServiceStatusMessage(
              "Switch back to original tab " + (newValue ? "enabled!" : "disabled!"),
              "success",
            );
          }
        },
      );
    });
  }

  // Add event listeners for radio buttons
  for (const radioButton of summarizerRadioButtons) {
    radioButton.addEventListener("change", function () {
      if (this.checked) {
        saveSummarizerService(this.value);
      }
    });
  }

  // Function to save the selected summarizer service
  function saveSummarizerService(service) {
    chrome.storage.sync.set(
      {
        summarizerService: service,
      },
      () => {
        if (chrome.runtime.lastError) {
          showServiceStatusMessage(
            "Error saving summarizer service: " +
              chrome.runtime.lastError.message,
            "error",
          );
        } else {
          showServiceStatusMessage(
            "Summarizer service updated to " +
              service.charAt(0).toUpperCase() +
              service.slice(1) +
              "!",
            "success",
          );
        }
      },
    );
  }

  // Function to display service status messages
  function showServiceStatusMessage(message, type) {
    serviceStatusMessage.textContent = message;
    serviceStatusMessage.className = type;
    serviceStatusMessage.style.display = "block";

    setTimeout(() => {
      serviceStatusMessage.style.display = "none";
    }, 3000);
  }

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
