document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const apiKeyInput = document.getElementById("apiKey");
  const generateBtn = document.getElementById("generateBtn");
  const statusDiv = document.getElementById("status");
  const modelSelect = document.getElementById("modelSelect");
  const refreshModelsBtn = document.getElementById("refreshModelsBtn");
  const fontSizeInput = document.getElementById("fontSize");
  const fontColorInput = document.getElementById("fontColor");
  const bgColorInput = document.getElementById("bgColor");
  const bgOpacityInput = document.getElementById("bgOpacity");
  const subtitlesEnabledToggle = document.getElementById("subtitlesEnabled");
  const applyStyleBtn = document.getElementById("applyStyleBtn");

  // Constants for model fetching
  const GOOGLE_DOCS_URL = "https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/video-understanding";
  const TABLE_SELECTORS = [
    ".devsite-table-wrapper",
    "table.responsive",
    ".devsite-article table"
  ];

  // List of Gemini models with video understanding capability (fallback)
  let videoModels = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b"
  ];

  // Function to fetch models from Google Cloud documentation
  async function fetchModelsFromDocs() {
    try {
      statusDiv.textContent = "Fetching latest models...";
      
      // Fetch the documentation page
      const response = await fetch(GOOGLE_DOCS_URL);
      const html = await response.text();
      
      // Parse HTML and extract model names from the table
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      
      // Try multiple selectors for robustness
      let tableWrapper = null;
      for (const selector of TABLE_SELECTORS) {
        tableWrapper = doc.querySelector(selector);
        if (tableWrapper) break;
      }
      
      if (tableWrapper) {
        const models = [];
        const rows = tableWrapper.querySelectorAll("table tbody tr");
        
        rows.forEach(row => {
          const cells = row.querySelectorAll("td");
          if (cells.length > 0) {
            // First column should contain the model name
            const modelName = cells[0].textContent.trim();
            if (modelName && modelName.startsWith("gemini")) {
              models.push(modelName);
            }
          }
        });
        
        if (models.length > 0) {
          videoModels = models;
          statusDiv.textContent = "";
          return true;
        }
      }
      
      statusDiv.textContent = "";
      return false;
    } catch (error) {
      console.error("Error fetching models from docs:", error);
      statusDiv.textContent = "";
      return false;
    }
  }

  // Create a div for displaying existing subtitles message
  const existingSubtitlesDiv = document.createElement("div");
  existingSubtitlesDiv.id = "existingSubtitles";
  existingSubtitlesDiv.style.marginTop = "10px";
  existingSubtitlesDiv.style.color = "green";
  generateBtn.parentNode.insertBefore(
    existingSubtitlesDiv,
    generateBtn.nextSibling
  ); // Add it below the button

  // Load saved API key and selected model from local storage
  chrome.storage.local.get(["geminiApiKey", "selectedModel", "subtitleStyles", "subtitlesEnabled"], function (result) {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
    
    // Fetch models and populate dropdown
    fetchModelsFromDocs().then(() => {
      populateModelDropdown(result.selectedModel);
    });
    
    if (result.subtitleStyles) {
      const styles = result.subtitleStyles;
      if (styles.fontSize) fontSizeInput.value = styles.fontSize;
      if (styles.fontColor) fontColorInput.value = styles.fontColor;
      if (styles.bgColor) bgColorInput.value = styles.bgColor;
      if (styles.bgOpacity !== undefined) bgOpacityInput.value = styles.bgOpacity;
    }
    
    // Load subtitle enabled state (default to true)
    if (result.subtitlesEnabled !== undefined) {
      subtitlesEnabledToggle.checked = result.subtitlesEnabled;
    }
  });

  // Populate model dropdown
  function populateModelDropdown(selectedModel) {
    modelSelect.innerHTML = "";
    videoModels.forEach(model => {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      modelSelect.appendChild(option);
    });
    // Restore selected model if provided
    if (selectedModel && videoModels.includes(selectedModel)) {
      modelSelect.value = selectedModel;
    }
  }

  // Initialize model dropdown
  // Note: populateModelDropdown is called in the storage.local.get callback above

  // Handle refresh models button
  refreshModelsBtn.addEventListener("click", async function () {
    statusDiv.textContent = "Refreshing model list...";
    const success = await fetchModelsFromDocs();
    chrome.storage.local.get(["selectedModel"], function (result) {
      populateModelDropdown(result.selectedModel);
    });
    statusDiv.textContent = success ? "Model list refreshed!" : "Using default model list";
    setTimeout(() => {
      if (statusDiv.textContent.includes("refreshed") || statusDiv.textContent.includes("default")) {
        statusDiv.textContent = "";
      }
    }, 2000);
  });

  // Save selected model when changed
  modelSelect.addEventListener("change", function () {
    chrome.storage.local.set({ selectedModel: modelSelect.value });
  });

  // Handle apply styles button
  applyStyleBtn.addEventListener("click", function () {
    const styles = {
      fontSize: parseInt(fontSizeInput.value),
      fontColor: fontColorInput.value,
      bgColor: bgColorInput.value,
      bgOpacity: parseInt(bgOpacityInput.value)
    };
    
    const subtitlesEnabled = subtitlesEnabledToggle.checked;

    // Save styles and enabled state to storage
    chrome.storage.local.set({ 
      subtitleStyles: styles,
      subtitlesEnabled: subtitlesEnabled
    }, function () {
      statusDiv.textContent = "Settings applied!";
      setTimeout(() => {
        if (statusDiv.textContent === "Settings applied!") {
          statusDiv.textContent = "";
        }
      }, 2000);

      // Send message to content script to update styles and visibility
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "updateSubtitleStyles",
            styles: styles,
            enabled: subtitlesEnabled
          });
        }
      });
    });
  });

  // Check if subtitles already exist for the current video
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // Helper function to clean YouTube URLs
    function cleanYouTubeUrl(originalUrl) {
      try {
        const url = new URL(originalUrl);
        const videoId = url.searchParams.get("v");
        if (videoId) {
          // Reconstruct a minimal URL
          return `${url.protocol}//${url.hostname}${url.pathname}?v=${videoId}`;
        }
      } catch (e) {
        console.error("Error parsing URL for cleaning:", originalUrl, e);
      }
      // Fallback to original if cleaning fails or no 'v' param found
      return originalUrl;
    }

    const currentTab = tabs[0];
    console.log("URL to check:", cleanYouTubeUrl(currentTab.url));

    if (currentTab && currentTab.url && currentTab.url.includes("youtube")) {
      const videoUrl = new URL(currentTab.url);
      const videoId = videoUrl.searchParams.get("v"); // Extract the video ID
      console.log("Video URL:", videoUrl);
      console.log("Video ID:", videoId);

      if (videoId) {
        chrome.storage.local.get(
          [cleanYouTubeUrl(currentTab.url)],
          function (result) {
            if (result[cleanYouTubeUrl(currentTab.url)]) {
              existingSubtitlesDiv.textContent =
                "Subtitles already exist for this video. 🚀";
            } else {
              existingSubtitlesDiv.textContent = ""; // Clear the message if no subtitles exist
            }
          }
        );
      }
    }
  });

  // Handle the "Generate Subtitles" button click
  generateBtn.addEventListener("click", function () {
    const apiKey = apiKeyInput.value.trim();
    const selectedModel = modelSelect.value;
    statusDiv.textContent = ""; // Clear previous status

    if (!apiKey) {
      statusDiv.textContent = "Please enter a valid API key";
      return;
    }

    // Save the API key and selected model to local storage
    chrome.storage.local.set({ geminiApiKey: apiKey, selectedModel: selectedModel });

    // Show loading status
    statusDiv.textContent = "Requesting subtitles...";
    generateBtn.disabled = true; // Disable button during processing

    // Query the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      console.log(
        "Popup: Active tab URL:",
        currentTab ? currentTab.url : "No tab found"
      );

      if (
        currentTab &&
        currentTab.url &&
        currentTab.url.includes("youtube.com/watch")
      ) {
        // Send a message to the content script to generate subtitles
        chrome.tabs.sendMessage(
          currentTab.id,
          { action: "generateSubtitles", apiKey: apiKey, model: selectedModel },
          function (response) {
            if (chrome.runtime.lastError) {
              console.error("Popup Error:", chrome.runtime.lastError.message);
              statusDiv.textContent = `Error: ${chrome.runtime.lastError.message}. Try reloading the YouTube page.`;
              generateBtn.disabled = false;
            } else if (response && response.status === "started") {
              statusDiv.textContent =
                "Processing video... (This may take a while)";
            } else if (response && response.status === "error") {
              statusDiv.textContent = `Error: ${
                response.message || "Could not start process."
              }`;
              generateBtn.disabled = false;
            } else {
              statusDiv.textContent =
                "Error: Unexpected response from content script.";
              generateBtn.disabled = false;
            }
          }
        );
      } else {
        statusDiv.textContent = "Not a YouTube video page.";
        generateBtn.disabled = false;
      }
    });
  });

  // Listen for status updates from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updatePopupStatus") {
      statusDiv.textContent = message.text;
      if (message.error || message.success) {
        generateBtn.disabled = false; // Re-enable button on completion or error
      }
    }
  });
});
