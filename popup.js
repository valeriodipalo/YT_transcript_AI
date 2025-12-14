// Popup script - handles the extension popup UI and logic

let currentVideoInfo = null;
let capturedTime = null;
let capturedFrame = null;

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  await loadVideoInfo();
  await loadTimestamps();
  setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
  document.getElementById('capture-btn').addEventListener('click', captureTimestamp);
  document.getElementById('save-btn').addEventListener('click', saveTimestamp);
  document.getElementById('clear-all-btn').addEventListener('click', clearAllTimestamps);
  document.getElementById('open-library-btn').addEventListener('click', openLibrary);
  document.getElementById('edit-video-tags-btn').addEventListener('click', showVideoTagsEditor);
  document.getElementById('save-video-tags-btn').addEventListener('click', saveVideoTags);
  document.getElementById('cancel-video-tags-btn').addEventListener('click', hideVideoTagsEditor);
  document.getElementById('export-btn').addEventListener('click', exportCurrentVideo);
  document.getElementById('tag-filter').addEventListener('input', filterByTag);
  document.getElementById('clear-capture-btn').addEventListener('click', clearCapture);
}

// Open library page
function openLibrary() {
  chrome.runtime.openOptionsPage();
}

// Show video tags editor
function showVideoTagsEditor() {
  const editor = document.getElementById('video-tags-editor');
  const currentTags = currentVideoInfo.tags || [];
  document.getElementById('video-tags-input').value = currentTags.join(', ');
  editor.style.display = 'block';
  document.getElementById('video-tags-input').focus();
}

// Hide video tags editor
function hideVideoTagsEditor() {
  document.getElementById('video-tags-editor').style.display = 'none';
  document.getElementById('video-tags-input').value = '';
}

// Save video tags
async function saveVideoTags() {
  const tagsInput = document.getElementById('video-tags-input').value;
  const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
  
  // Save to video metadata
  const metaKey = `video_meta_${currentVideoInfo.videoId}`;
  const metaResult = await chrome.storage.local.get(metaKey);
  const videoMeta = metaResult[metaKey] || {
    videoId: currentVideoInfo.videoId,
    title: currentVideoInfo.title,
    url: currentVideoInfo.url
  };
  
  videoMeta.tags = tags;
  videoMeta.updatedAt = new Date().toISOString();
  
  await chrome.storage.local.set({ [metaKey]: videoMeta });
  
  currentVideoInfo.tags = tags;
  displayVideoTags();
  hideVideoTagsEditor();
}

// Display video tags
function displayVideoTags() {
  const tagsDisplay = document.getElementById('video-tags-display');
  const tags = currentVideoInfo.tags || [];
  
  if (tags.length === 0) {
    tagsDisplay.innerHTML = '';
    return;
  }
  
  tagsDisplay.innerHTML = tags.map(tag => 
    `<span class="tag">${escapeHtml(tag)}</span>`
  ).join('');
}

// Load current video information from the active tab
async function loadVideoInfo() {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('youtube.com')) {
      document.getElementById('capture-btn').disabled = true;
      statusDot.style.background = 'var(--text-tertiary)';
      statusText.textContent = 'Not YouTube';
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' });
    currentVideoInfo = response;

    if (response.isYouTube && response.videoId) {
      // Load video metadata (tags)
      const metaKey = `video_meta_${response.videoId}`;
      const metaResult = await chrome.storage.local.get(metaKey);
      const videoMeta = metaResult[metaKey] || {};
      
      currentVideoInfo.tags = videoMeta.tags || [];
      
      document.querySelector('.video-title').textContent = response.title;
      displayVideoTags();
      document.getElementById('capture-btn').disabled = false;
      statusDot.style.background = 'var(--success)';
      statusText.textContent = 'Connected';
    } else {
      document.getElementById('capture-btn').disabled = true;
      statusDot.style.background = 'var(--warning)';
      statusText.textContent = 'No video';
    }
  } catch (error) {
    console.error('Error loading video info:', error);
    document.getElementById('capture-btn').disabled = true;
    statusDot.style.background = 'var(--error)';
    statusText.textContent = 'Error';
  }
}

// Capture current timestamp with frame
async function captureTimestamp() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get video info and capture frame in parallel
    const [videoResponse, frameResponse] = await Promise.all([
      chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' }),
      chrome.tabs.sendMessage(tab.id, { action: 'captureFrame' })
    ]);
    
    capturedTime = videoResponse.currentTime;
    
    // Store frame data
    if (frameResponse.success) {
      capturedFrame = frameResponse.frameDataUrl;
    } else {
      // Fallback to YouTube thumbnail
      capturedFrame = `https://img.youtube.com/vi/${currentVideoInfo.videoId}/hqdefault.jpg`;
    }
    
    // Show preview
    showCapturePreview();
    
    document.getElementById('note-input').focus();
    document.getElementById('save-btn').disabled = false;
    
    // Add capture animation
    const captureBtn = document.getElementById('capture-btn');
    captureBtn.classList.add('flash-success');
    setTimeout(() => captureBtn.classList.remove('flash-success'), 600);
    
  } catch (error) {
    console.error('Error capturing timestamp:', error);
  }
}

// Show capture preview
function showCapturePreview() {
  const preview = document.getElementById('capture-preview');
  const thumbnail = document.getElementById('preview-thumbnail');
  const timestamp = document.getElementById('preview-timestamp');
  
  thumbnail.src = capturedFrame;
  timestamp.textContent = formatTime(capturedTime);
  preview.style.display = 'block';
}

// Clear capture
function clearCapture() {
  capturedTime = null;
  capturedFrame = null;
  
  const preview = document.getElementById('capture-preview');
  preview.style.display = 'none';
  
  document.getElementById('save-btn').disabled = true;
}

// Save timestamp with note
async function saveTimestamp() {
  if (capturedTime === null) {
    return;
  }

  const note = document.getElementById('note-input').value.trim();
  
  if (!note) {
    // Shake animation for empty note
    const noteInput = document.getElementById('note-input');
    noteInput.style.animation = 'none';
    noteInput.offsetHeight; // Trigger reflow
    noteInput.style.animation = 'shake 0.5s ease';
    noteInput.focus();
    return;
  }

  // Parse tags
  const tagsInput = document.getElementById('note-tags-input').value;
  const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

  const timestampData = {
    id: Date.now().toString(),
    videoId: currentVideoInfo.videoId,
    videoTitle: currentVideoInfo.title,
    videoUrl: currentVideoInfo.url,
    time: capturedTime,
    note: note,
    tags: tags,
    thumbnail: capturedFrame,
    createdAt: new Date().toISOString()
  };

  // Get existing timestamps for this video
  const storageKey = `timestamps_${currentVideoInfo.videoId}`;
  const result = await chrome.storage.local.get(storageKey);
  const timestamps = result[storageKey] || [];
  
  // Add new timestamp
  timestamps.push(timestampData);
  
  // Save back to storage
  await chrome.storage.local.set({ [storageKey]: timestamps });

  // Update video metadata
  const metaKey = `video_meta_${currentVideoInfo.videoId}`;
  const metaResult = await chrome.storage.local.get(metaKey);
  const videoMeta = metaResult[metaKey] || {
    videoId: currentVideoInfo.videoId,
    title: currentVideoInfo.title,
    url: currentVideoInfo.url,
    tags: currentVideoInfo.tags || []
  };
  
  videoMeta.noteCount = timestamps.length;
  videoMeta.updatedAt = new Date().toISOString();
  
  await chrome.storage.local.set({ [metaKey]: videoMeta });

  // Clear the form
  document.getElementById('note-input').value = '';
  document.getElementById('note-tags-input').value = '';
  clearCapture();

  // Reload the timestamps list
  await loadTimestamps();
}

// Filter timestamps by tag
function filterByTag() {
  const filterText = document.getElementById('tag-filter').value.toLowerCase().trim();
  const timestampItems = document.querySelectorAll('.timestamp-item');
  
  timestampItems.forEach(item => {
    if (!filterText) {
      item.style.display = 'flex';
      return;
    }
    
    const tags = item.dataset.tags ? item.dataset.tags.toLowerCase() : '';
    const note = item.querySelector('.timestamp-note').textContent.toLowerCase();
    
    if (tags.includes(filterText) || note.includes(filterText)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// Load and display timestamps for current video
async function loadTimestamps() {
  const timestampsList = document.getElementById('timestamps-list');
  
  if (!currentVideoInfo || !currentVideoInfo.videoId) {
    timestampsList.innerHTML = '<div class="empty-state">Open a YouTube video to see saved notes</div>';
    return;
  }

  const storageKey = `timestamps_${currentVideoInfo.videoId}`;
  const result = await chrome.storage.local.get(storageKey);
  const timestamps = result[storageKey] || [];

  if (timestamps.length === 0) {
    timestampsList.innerHTML = '<div class="empty-state">No notes yet — capture your first moment!</div>';
    return;
  }

  // Sort timestamps by time
  timestamps.sort((a, b) => a.time - b.time);

  // Display timestamps with thumbnails
  timestampsList.innerHTML = timestamps.map(ts => {
    const thumbnail = ts.thumbnail || `https://img.youtube.com/vi/${ts.videoId}/hqdefault.jpg`;
    
    return `
    <div class="timestamp-item" data-time="${ts.time}" data-tags="${(ts.tags || []).join(',')}">
      <div class="timestamp-thumb">
        <img src="${thumbnail}" alt="Frame at ${formatTime(ts.time)}" loading="lazy">
      </div>
      <div class="timestamp-content">
        <div class="timestamp-header">
          <span class="timestamp-time">${formatTime(ts.time)}</span>
          <button class="delete-btn" data-id="${ts.id}" title="Delete">×</button>
        </div>
        <div class="timestamp-note">${escapeHtml(ts.note)}</div>
        ${ts.tags && ts.tags.length > 0 ? `
          <div class="timestamp-tags">
            ${ts.tags.map(tag => `<span class="tag note-tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `}).join('');

  // Add click listeners to timestamp items
  timestampsList.querySelectorAll('.timestamp-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-btn')) {
        await deleteTimestamp(e.target.dataset.id);
      } else {
        const time = parseFloat(item.dataset.time);
        await seekToTime(time);
      }
    });
  });
}

// Seek to specific time in video
async function seekToTime(time) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'seekToTime', time: time });
  } catch (error) {
    console.error('Error seeking to time:', error);
  }
}

// Delete a specific timestamp
async function deleteTimestamp(id) {
  const storageKey = `timestamps_${currentVideoInfo.videoId}`;
  const result = await chrome.storage.local.get(storageKey);
  let timestamps = result[storageKey] || [];
  
  timestamps = timestamps.filter(ts => ts.id !== id);
  
  await chrome.storage.local.set({ [storageKey]: timestamps });
  
  // Update video metadata
  const metaKey = `video_meta_${currentVideoInfo.videoId}`;
  const metaResult = await chrome.storage.local.get(metaKey);
  const videoMeta = metaResult[metaKey] || {};
  videoMeta.noteCount = timestamps.length;
  videoMeta.updatedAt = new Date().toISOString();
  await chrome.storage.local.set({ [metaKey]: videoMeta });
  
  await loadTimestamps();
}

// Clear all timestamps for current video
async function clearAllTimestamps() {
  if (!currentVideoInfo || !currentVideoInfo.videoId) {
    return;
  }

  if (!confirm('Delete all notes for this video?')) {
    return;
  }

  const storageKey = `timestamps_${currentVideoInfo.videoId}`;
  await chrome.storage.local.remove(storageKey);
  
  // Update video metadata
  const metaKey = `video_meta_${currentVideoInfo.videoId}`;
  const metaResult = await chrome.storage.local.get(metaKey);
  const videoMeta = metaResult[metaKey] || {};
  videoMeta.noteCount = 0;
  videoMeta.updatedAt = new Date().toISOString();
  await chrome.storage.local.set({ [metaKey]: videoMeta });
  
  await loadTimestamps();
}

// Export current video's notes
async function exportCurrentVideo() {
  if (!currentVideoInfo || !currentVideoInfo.videoId) {
    return;
  }

  const storageKey = `timestamps_${currentVideoInfo.videoId}`;
  const metaKey = `video_meta_${currentVideoInfo.videoId}`;
  
  const result = await chrome.storage.local.get([storageKey, metaKey]);
  const timestamps = result[storageKey] || [];
  const videoMeta = result[metaKey] || {};

  const exportData = {
    video: {
      ...videoMeta,
      videoId: currentVideoInfo.videoId,
      title: currentVideoInfo.title,
      url: currentVideoInfo.url
    },
    timestamps: timestamps,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `timestamp-notes-${currentVideoInfo.videoId}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Helper function to format time
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
