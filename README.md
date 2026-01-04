![preview](https://github.com/za01br/yt-subtitle-extension/blob/main/preview.png)

# Chrome Extension: YouTube Subtitles Generator

Chrome extension that allows users to generate subtitles for YouTube videos using their own Gemini AI API key. The extension stores generated subtitles locally, so they can be reused without needing to regenerate them.

## Gemini Model

This extension **dynamically fetches** the latest Gemini models with video understanding capability from [Google Cloud's documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/video-understanding). Current models include:
- `gemini-2.0-flash-exp`
- `gemini-1.5-pro`
- `gemini-1.5-flash`
- `gemini-1.5-flash-8b`

You can select your preferred model from the dropdown in the extension popup and refresh the list to get the latest available models.

## Features

- [x] **Use Your Own Gemini API Key**: Integrate your Gemini AI API key to generate subtitles.
- [x] **Generate Subtitles for YouTube Videos**: Automatically fetch subtitles in SRT format for any YouTube video.
- [x] **Local Storage of Subtitles**: Subtitles are stored locally for each video, enabling quick access when revisiting the same video.
- [x] **Dynamic Model Selection**: Automatically fetches the latest Gemini models with video understanding capability.
- [x] **Subtitle Settings**: 
  - Enable/disable subtitles with a toggle switch
  - Customize subtitle appearance (font size, font color, background color, transparency)
- [x] **Persistent Subtitle Display**: Subtitles remain visible when video is paused.
- [ ] Delete stored subtitles
- [ ] Enable multiple languages

## Installation

1. Clone or download this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer Mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the folder containing this project.
5. The extension will now appear in your Chrome extensions list.

## How to Use

1. Open a YouTube video.
2. Click on the extension icon in the Chrome toolbar.
3. Enter your Gemini API key in the input field.
4. (Optional) Select your preferred Gemini model from the dropdown or click the refresh button (↻) to get the latest models.
5. (Optional) Customize subtitle appearance and enable/disable subtitles using the Subtitle Settings section.
6. Click **Generate Caption Closed** to fetch subtitles for the video.
7. If subtitles have already been generated for the video, they will load automatically.
8. Use the toggle in Subtitle Settings to show/hide subtitles at any time.

## Documentation

For a comprehensive technical overview of the extension architecture and implementation details, see [docs/overview.md](docs/overview.md).

## File Overview

### `manifest.json`

Defines the extension's metadata, permissions, and resources. It specifies the background script, content script, and popup interface.

### `background.js`

Handles communication with the Gemini API and manages local storage for subtitles. It processes requests from the content script and popup.

### `content.js`

Runs on YouTube pages to manage subtitle display. It listens for messages from the background script and popup, loads stored subtitles, and updates the UI.

### `popup.html`

Defines the structure and layout of the popup interface.

### `popup.js`

Manages the popup interface. It allows users to input their Gemini API key, check for existing subtitles, and request new subtitles.

### `subtitles.css`

Contains styles for the subtitle display on YouTube videos.

### `README.md`

Provides documentation for the project.

## Flow Diagram

```plaintext
+-------------------+       +-------------------+       +-------------------+
|   popup.html      |       |   popup.js        |       |   content.js      |
|-------------------|       |-------------------|       |-------------------|
| User interacts    | ----> | Sends requests    | ----> | Displays subtitles|
| with the popup    |       | to background.js  |       | and updates UI    |
+-------------------+       +-------------------+       +-------------------+

+-------------------+
|   background.js   |
|-------------------|
| Handles API calls |
| and stores data   |
+-------------------+
```

## Contributing

Feel free to fork this repository and submit pull requests for improvements or new features.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
