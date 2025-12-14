# YouTube Timestamp Notes - Chrome Extension

A powerful Chrome extension that lets you save timestamps and notes while watching YouTube videos, with a comprehensive tagging system and library for organizing your notes.

## Features

### Core Features
- 🎯 **Capture Timestamps**: Click a button to capture the current video timestamp
- 📝 **Add Notes**: Write text notes for each timestamp
- 💾 **Persistent Storage**: All your notes are saved per video
- 🔍 **Easy Navigation**: Click any saved timestamp to jump to that moment in the video
- 🗑️ **Manage Notes**: Delete individual notes or clear all notes for a video

### New in Version 2.0
- 🏷️ **Tag System**: Add tags to both videos and individual notes
- 📚 **Video Library**: View all videos you've taken notes on in one place
- 🔎 **Search & Filter**: Search across all notes and filter by tags
- 📤 **Export/Import**: Export your notes as JSON files and import them later
- 📊 **Statistics**: See how many videos, notes, and tags you have
- 🎨 **Better Organization**: Sort videos by date, title, or number of notes

## Installation

1. **Download the Extension Files**
   - Make sure you have all the files in a folder:
     - manifest.json
     - popup.html, popup.js
     - library.html, library.js
     - content.js
     - styles.css, library-styles.css
     - icon16.png, icon48.png, icon128.png

2. **Load the Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right)
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list!

3. **Pin the Extension** (Optional but Recommended)
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "YouTube Timestamp Notes"
   - Click the pin icon to keep it visible

## How to Use

### Taking Notes on a Video

1. **Open a YouTube Video**
   - Navigate to any YouTube video

2. **Open the Extension**
   - Click the extension icon in your toolbar
   - You should see the video title displayed

3. **Add Video Tags** (Optional)
   - Click "🏷️ Edit Video Tags"
   - Enter tags separated by commas (e.g., "tutorial, javascript, advanced")
   - Click "Save"

4. **Capture a Timestamp**
   - Play the video to the moment you want to save
   - Click "🎯 Capture Current Timestamp"
   - The current time will be shown

5. **Add Your Note**
   - Type your note in the text area
   - Optionally add tags for this specific note (e.g., "important, bug, review")
   - Click "💾 Save Note"

6. **View Your Saved Timestamps**
   - All saved timestamps for the current video appear below
   - They're sorted chronologically
   - Click on any timestamp to jump to that time

### Using the Library

1. **Open the Library**
   - Click the "📚" button in the popup, or
   - Right-click the extension icon → "Options"

2. **Browse Your Videos**
   - See all videos you've taken notes on
   - Each video shows:
     - Title and link to the video
     - Video tags
     - Number of notes
     - Last update time
     - All notes with their timestamps and tags

3. **Search and Filter**
   - Use the search bar to find specific content
   - Filter by tags to see related videos/notes
   - Sort by: Recently Updated, Oldest First, Title, or Most Notes

4. **Export Your Data**
   - Export a single video: Click "📤 Export" on any video card
   - Export everything: Click "📤 Export All" at the top
   - Saves as a JSON file you can back up or share

5. **Import Data**
   - Click "📥 Import" at the top
   - Select a previously exported JSON file
   - Your notes will be restored

6. **Jump to Videos**
   - Click on any video title to open it on YouTube
   - Click on any timestamp to open the video at that exact moment

## Tagging System

### Video Tags
- Categorize entire videos (e.g., "tutorial", "conference", "review")
- Helps organize your library
- Visible in both popup and library

### Note Tags
- Tag individual notes (e.g., "important", "todo", "quote", "question")
- Helps find specific types of notes across all videos
- Color-coded differently from video tags

### Tag Best Practices
- Use consistent naming (lowercase is recommended)
- Use broad categories for videos (tutorial, review, entertainment)
- Use specific tags for notes (action-item, key-insight, timestamp-to-share)
- Tags are searchable and filterable

## Data Management

### Storage
- All data is stored locally using Chrome's Storage API
- Each video has its own set of timestamps
- Video metadata (tags, note count) is stored separately
- Data persists between browser sessions

### Export Format
The JSON export includes:
```json
{
  "video": {
    "videoId": "...",
    "title": "...",
    "url": "...",
    "tags": ["tag1", "tag2"]
  },
  "timestamps": [
    {
      "id": "...",
      "time": 123.45,
      "note": "...",
      "tags": ["tag1"],
      "createdAt": "2024-..."
    }
  ],
  "exportedAt": "2024-..."
}
```

### Privacy
- All data is stored locally on your computer
- No data is sent to any external servers
- Export files are saved locally to your downloads folder

## Keyboard Workflow Tips

1. Use keyboard shortcuts for faster note-taking
2. Keep the popup open while watching
3. Use descriptive tags for easy filtering later
4. Export your notes regularly as backup

## Future Enhancements (Planned)

The following features are planned for future releases:
- LLM integration to analyze video transcripts
- Automatic extraction of what was said at saved timestamps
- AI-powered insights from saved notes
- Summary generation from multiple related videos
- Smart tag suggestions based on content

## File Structure

```
youtube-timestamp-notes/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── library.html          # Library page UI
├── library.js            # Library page logic
├── content.js            # Script that runs on YouTube pages
├── styles.css            # Popup styling
├── library-styles.css    # Library page styling
├── icon16.png            # Extension icon (16x16)
├── icon48.png            # Extension icon (48x48)
├── icon128.png           # Extension icon (128x128)
└── README.md             # This file
```

## Troubleshooting

**Extension icon is grayed out**
- Make sure you're on a YouTube video page (youtube.com/watch)

**"No video detected" message**
- Refresh the YouTube page
- Make sure the video is loaded and playing

**Timestamps not saving**
- Check that Chrome has storage permissions enabled
- Check the browser console for errors (F12 → Console)

**Can't jump to timestamp**
- Make sure you're on the same video where the timestamp was saved
- Try refreshing the page

**Library not showing all videos**
- Try the "Import" feature if you previously exported data
- Clear filters and search to see all videos

**Tags not appearing**
- Make sure you're using comma-separated tags
- Tags are trimmed of whitespace automatically

## Development

To modify the extension:
1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Version History

**v2.0** - Added tagging system, library view, export/import
**v1.0** - Initial release with basic timestamp and note functionality

## License

Free to use and modify!

## Feedback

Found a bug or have a feature request? This extension is in active development!
