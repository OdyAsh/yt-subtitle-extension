# YouTube Subtitles Generator - Technical Overview

## Introduction

The YouTube Subtitles Generator is a Chrome extension that leverages Google's Gemini AI to automatically generate subtitles for YouTube videos. This document provides a comprehensive overview of the extension's architecture, components, and functionality.

## Architecture Overview

The extension follows a typical Chrome extension architecture with three main components:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Popup     │────▶│   Content    │────▶│  Background  │
│   (UI)      │◀────│   Script     │◀────│   Service    │
└─────────────┘     └──────────────┘     └──────────────┘
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐     ┌──────────────┐
                    │   YouTube    │     │  Gemini API  │
                    │     Page     │     │              │
                    └──────────────┘     └──────────────┘
```

## Core Components

### 1. Popup Interface (`popup.html` & `popup.js`)

The popup provides the user interface for interacting with the extension. It includes:

#### Features:
- **API Key Management**: Secure input for Gemini API key (stored locally)
- **Model Selection**: Dropdown to select from Gemini models with video understanding capability
- **Model Refresh**: Button to refresh the list of available models
- **Subtitle Styling Controls**: 
  - Font size adjustment (10-50px)
  - Font color picker
  - Background color picker
  - Background transparency slider (0-100%)
- **Status Display**: Real-time feedback on subtitle generation progress

#### Supported Models:
The extension supports the following Gemini models with video understanding capability:
- `gemini-2.5-pro-exp-03-25` (default)
- `gemini-2.0-flash-exp`
- `gemini-1.5-pro`
- `gemini-1.5-flash`
- `gemini-1.5-flash-8b`

### 2. Content Script (`content.js`)

The content script runs on YouTube pages and manages subtitle display.

#### Key Responsibilities:
- **Video Player Detection**: Locates the YouTube video player and container
- **Subtitle Rendering**: Creates and positions subtitle overlay elements
- **Timing Synchronization**: Updates subtitles based on video playback time
- **Style Application**: Applies user-defined styling to subtitles
- **Event Handling**: 
  - Play/pause events (subtitles now display when paused)
  - Seek events (updates subtitle position)
  - URL changes (for SPA navigation)

#### Subtitle Display Logic:
```javascript
// Subtitles are updated every 100ms
// They display when video time falls within subtitle time range
if (currentTime >= subtitle.startTime && currentTime <= subtitle.endTime) {
  displaySubtitle(subtitle.text);
}
```

#### Key Features:
- **Persistent Display**: Subtitles remain visible when video is paused
- **Dynamic Styling**: Real-time style updates without page reload
- **Local Caching**: Subtitles are cached per video URL

### 3. Background Service Worker (`background.js`)

The background script handles API communication and data management.

#### Key Responsibilities:
- **Gemini API Integration**: Communicates with Google's Gemini API
- **SRT Parsing**: Converts Gemini's SRT response into structured subtitle data
- **Local Storage Management**: Caches subtitles to avoid redundant API calls
- **Error Handling**: Manages API errors and provides user feedback

#### API Request Flow:
```javascript
1. Receive request from content script
2. Check local storage for cached subtitles
3. If not cached:
   a. Construct API request with selected model
   b. Send video URL and prompt to Gemini
   c. Parse SRT response
   d. Cache parsed subtitles
   e. Send to content script
4. If cached:
   a. Retrieve from storage
   b. Send to content script
```

### 4. Stylesheet (`subtitles.css`)

Provides base styling for subtitle elements that can be overridden by user preferences.

## Data Flow

### Subtitle Generation Flow:

1. **User Initiates Generation**:
   - User opens popup on YouTube video page
   - Enters API key and selects model
   - Clicks "Generate Caption Closed" button

2. **Request Processing**:
   - Popup sends message to content script
   - Content script forwards request to background service
   - Background checks for cached subtitles

3. **API Call** (if not cached):
   - Background constructs Gemini API request
   - Sends YouTube URL with SRT generation prompt
   - Receives and parses SRT response
   - Stores in local storage

4. **Subtitle Display**:
   - Background sends parsed subtitles to content script
   - Content script creates overlay elements
   - Starts synchronization with video playback

### Style Update Flow:

1. User adjusts styling controls in popup
2. Clicks "Apply Styles" button
3. Popup saves styles to local storage
4. Popup sends message to content script
5. Content script applies styles to subtitle elements

## Storage Structure

The extension uses Chrome's local storage API:

```javascript
{
  "geminiApiKey": "user's API key",
  "selectedModel": "model identifier",
  "subtitleStyles": {
    "fontSize": 18,
    "fontColor": "#ffffff",
    "bgColor": "#080808",
    "bgOpacity": 75
  },
  "https://www.youtube.com/watch?v=VIDEO_ID": [
    {
      "startTime": 1000,  // milliseconds
      "endTime": 5000,
      "text": "Subtitle text"
    },
    // ... more subtitle entries
  ]
}
```

## Key Technologies

- **Chrome Extension APIs**: manifest v3, storage, messaging, tabs
- **Gemini AI API**: Video understanding and SRT generation
- **JavaScript**: ES6+ features, async/await
- **CSS**: Dynamic styling with CSS custom properties
- **SRT Format**: Standard subtitle format parsing

## Security Considerations

1. **API Key Storage**: Keys are stored locally using Chrome's storage API (not synced)
2. **Content Security**: Extension only runs on YouTube domains
3. **User Data**: No user data is transmitted except YouTube URLs to Gemini
4. **Permissions**: Minimal permissions requested (activeTab, storage, scripting)

## Performance Optimizations

1. **Subtitle Caching**: Generated subtitles are cached per video to avoid redundant API calls
2. **Efficient Updates**: 100ms update interval balances smoothness and performance
3. **Lazy Initialization**: Components initialize only when needed
4. **URL Cleaning**: Standardizes YouTube URLs to improve cache hit rate

## Future Enhancements

Potential areas for improvement:
- Multiple language support
- Subtitle export functionality
- Manual subtitle editing
- Subtitle search/navigation
- Keyboard shortcuts
- Offline subtitle support

## Troubleshooting

### Common Issues:

1. **Subtitles not appearing**:
   - Ensure video player is detected
   - Check browser console for errors
   - Verify API key is valid

2. **API Errors**:
   - Check API key permissions
   - Verify model supports video understanding
   - Check Gemini API quota/limits

3. **Style not applying**:
   - Click "Apply Styles" button
   - Reload YouTube page if needed
   - Check browser console for errors

## Development Setup

1. Clone the repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable Developer Mode
4. Click "Load unpacked"
5. Select the extension directory
6. Navigate to any YouTube video to test

## Contributing

When contributing to this project:
1. Follow existing code style and conventions
2. Test changes on multiple YouTube videos
3. Ensure compatibility with different video player states
4. Update documentation for new features
5. Consider performance impact of changes

## License

This project is licensed under the MIT License.
