// Library page script - displays all saved videos and notes

let allVideos = [];
let currentFilter = {
  search: '',
  tag: '',
  sort: 'recent'
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllVideos();
  setupEventListeners();
  renderVideos();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('search-input').addEventListener('input', handleSearch);
  document.getElementById('tag-filter-input').addEventListener('input', handleTagFilter);
  document.getElementById('sort-select').addEventListener('change', handleSort);
  document.getElementById('export-all-btn').addEventListener('click', exportAllData);
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });
  document.getElementById('import-file-input').addEventListener('change', importData);
}

// Load all videos and their timestamps
async function loadAllVideos() {
  const storage = await chrome.storage.local.get(null);
  allVideos = [];
  
  // Get all video metadata
  const videoMetas = {};
  Object.keys(storage).forEach(key => {
    if (key.startsWith('video_meta_')) {
      const videoId = key.replace('video_meta_', '');
      videoMetas[videoId] = storage[key];
    }
  });
  
  // Get all timestamps for each video
  Object.keys(storage).forEach(key => {
    if (key.startsWith('timestamps_')) {
      const videoId = key.replace('timestamps_', '');
      const timestamps = storage[key];
      
      if (timestamps && timestamps.length > 0) {
        const meta = videoMetas[videoId] || {};
        allVideos.push({
          videoId: videoId,
          title: timestamps[0].videoTitle || meta.title || 'Unknown Video',
          url: timestamps[0].videoUrl || meta.url || '',
          tags: meta.tags || [],
          timestamps: timestamps,
          noteCount: timestamps.length,
          updatedAt: meta.updatedAt || timestamps[timestamps.length - 1].createdAt
        });
      }
    }
  });
  
  updateStats();
}

// Update statistics display
function updateStats() {
  const totalNotes = allVideos.reduce((sum, v) => sum + v.noteCount, 0);
  const allTags = new Set();
  
  allVideos.forEach(video => {
    video.tags.forEach(tag => allTags.add(tag));
    video.timestamps.forEach(ts => {
      (ts.tags || []).forEach(tag => allTags.add(tag));
    });
  });
  
  document.getElementById('stats-videos').textContent = `${allVideos.length} video${allVideos.length !== 1 ? 's' : ''}`;
  document.getElementById('stats-notes').textContent = `${totalNotes} note${totalNotes !== 1 ? 's' : ''}`;
  document.getElementById('stats-tags').textContent = `${allTags.size} tag${allTags.size !== 1 ? 's' : ''}`;
}

// Handle search input
function handleSearch(e) {
  currentFilter.search = e.target.value.toLowerCase();
  renderVideos();
}

// Handle tag filter
function handleTagFilter(e) {
  currentFilter.tag = e.target.value.toLowerCase();
  renderVideos();
}

// Handle sort change
function handleSort(e) {
  currentFilter.sort = e.target.value;
  renderVideos();
}

// Filter and sort videos
function getFilteredVideos() {
  let filtered = [...allVideos];
  
  // Apply search filter
  if (currentFilter.search) {
    filtered = filtered.filter(video => {
      const titleMatch = video.title.toLowerCase().includes(currentFilter.search);
      const notesMatch = video.timestamps.some(ts => 
        ts.note.toLowerCase().includes(currentFilter.search)
      );
      return titleMatch || notesMatch;
    });
  }
  
  // Apply tag filter
  if (currentFilter.tag) {
    filtered = filtered.filter(video => {
      const videoTagMatch = video.tags.some(tag => 
        tag.toLowerCase().includes(currentFilter.tag)
      );
      const noteTagMatch = video.timestamps.some(ts =>
        (ts.tags || []).some(tag => tag.toLowerCase().includes(currentFilter.tag))
      );
      return videoTagMatch || noteTagMatch;
    });
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    switch (currentFilter.sort) {
      case 'recent':
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      case 'oldest':
        return new Date(a.updatedAt) - new Date(b.updatedAt);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'notes':
        return b.noteCount - a.noteCount;
      default:
        return 0;
    }
  });
  
  return filtered;
}

// Render videos list
function renderVideos() {
  const videosList = document.getElementById('videos-list');
  const filtered = getFilteredVideos();
  
  if (filtered.length === 0) {
    if (allVideos.length === 0) {
      videosList.innerHTML = `
        <div class="empty-state">
          <h2>No videos saved yet</h2>
          <p>Start taking notes on YouTube videos to see them here!</p>
        </div>
      `;
    } else {
      videosList.innerHTML = `
        <div class="empty-state">
          <h2>No videos match your filters</h2>
          <p>Try adjusting your search or tag filters.</p>
        </div>
      `;
    }
    return;
  }
  
  videosList.innerHTML = filtered.map(video => createVideoCard(video)).join('');
  
  // Add event listeners
  setupVideoCardListeners();
}

// Create HTML for a video card
function createVideoCard(video) {
  const date = new Date(video.updatedAt);
  const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  return `
    <div class="video-card" data-video-id="${video.videoId}">
      <div class="video-header">
        <div class="video-title-link">
          <h2 class="video-title" data-url="${escapeHtml(video.url)}">${escapeHtml(video.title)}</h2>
          <div class="video-meta">
            <span>📝 ${video.noteCount} note${video.noteCount !== 1 ? 's' : ''}</span>
            <span>🕒 ${formattedDate}</span>
          </div>
        </div>
        <div class="video-actions">
          <button class="video-action-btn export-video-btn" data-video-id="${video.videoId}">📤 Export</button>
          <button class="video-action-btn delete-video-btn" data-video-id="${video.videoId}">🗑️ Delete</button>
        </div>
      </div>
      
      ${video.tags.length > 0 ? `
        <div class="video-tags">
          ${video.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : ''}
      
      <div class="notes-list">
        <div class="notes-header">
          <h3>Notes (${video.noteCount})</h3>
          <button class="toggle-notes-btn" data-video-id="${video.videoId}">Hide</button>
        </div>
        <div class="notes-content" data-video-id="${video.videoId}">
          ${video.timestamps.sort((a, b) => a.time - b.time).map(ts => `
            <div class="note-item">
              <div class="note-header">
                <span class="note-timestamp" data-url="${escapeHtml(video.url)}" data-time="${ts.time}">
                  ${formatTime(ts.time)}
                </span>
                <button class="note-delete-btn" data-video-id="${video.videoId}" data-note-id="${ts.id}">×</button>
              </div>
              <div class="note-text">${escapeHtml(ts.note)}</div>
              ${ts.tags && ts.tags.length > 0 ? `
                <div class="note-tags">
                  ${ts.tags.map(tag => `<span class="tag note-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Setup event listeners for video cards
function setupVideoCardListeners() {
  // Video title clicks - open video
  document.querySelectorAll('.video-title').forEach(el => {
    el.addEventListener('click', () => {
      const url = el.dataset.url;
      if (url) {
        window.open(url, '_blank');
      }
    });
  });
  
  // Timestamp clicks - open video at timestamp
  document.querySelectorAll('.note-timestamp').forEach(el => {
    el.addEventListener('click', () => {
      const url = el.dataset.url;
      const time = el.dataset.time;
      if (url && time) {
        const urlWithTime = `${url}${url.includes('?') ? '&' : '?'}t=${Math.floor(time)}s`;
        window.open(urlWithTime, '_blank');
      }
    });
  });
  
  // Toggle notes
  document.querySelectorAll('.toggle-notes-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const videoId = btn.dataset.videoId;
      const notesContent = document.querySelector(`.notes-content[data-video-id="${videoId}"]`);
      const isHidden = notesContent.classList.contains('notes-collapsed');
      
      if (isHidden) {
        notesContent.classList.remove('notes-collapsed');
        btn.textContent = 'Hide';
      } else {
        notesContent.classList.add('notes-collapsed');
        btn.textContent = 'Show';
      }
    });
  });
  
  // Export video
  document.querySelectorAll('.export-video-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const videoId = btn.dataset.videoId;
      await exportVideo(videoId);
    });
  });
  
  // Delete video
  document.querySelectorAll('.delete-video-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const videoId = btn.dataset.videoId;
      await deleteVideo(videoId);
    });
  });
  
  // Delete individual note
  document.querySelectorAll('.note-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const videoId = btn.dataset.videoId;
      const noteId = btn.dataset.noteId;
      await deleteNote(videoId, noteId);
    });
  });
}

// Export a single video's data
async function exportVideo(videoId) {
  const video = allVideos.find(v => v.videoId === videoId);
  if (!video) return;
  
  const storageKey = `timestamps_${videoId}`;
  const metaKey = `video_meta_${videoId}`;
  const storage = await chrome.storage.local.get([storageKey, metaKey]);
  
  const exportData = {
    video: {
      videoId: videoId,
      title: video.title,
      url: video.url,
      tags: video.tags
    },
    timestamps: storage[storageKey] || [],
    exportedAt: new Date().toISOString()
  };
  
  downloadJSON(exportData, `youtube-notes-${videoId}-${Date.now()}.json`);
}

// Export all data
async function exportAllData() {
  const storage = await chrome.storage.local.get(null);
  const exportData = {
    videos: allVideos.map(v => ({
      videoId: v.videoId,
      title: v.title,
      url: v.url,
      tags: v.tags
    })),
    allTimestamps: {},
    exportedAt: new Date().toISOString(),
    version: '2.0'
  };
  
  // Include all timestamps
  Object.keys(storage).forEach(key => {
    if (key.startsWith('timestamps_')) {
      exportData.allTimestamps[key] = storage[key];
    }
  });
  
  downloadJSON(exportData, `youtube-notes-all-${Date.now()}.json`);
}

// Import data from JSON file
async function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Import timestamps
    if (data.allTimestamps) {
      // Full export
      for (const [key, value] of Object.entries(data.allTimestamps)) {
        await chrome.storage.local.set({ [key]: value });
      }
    } else if (data.timestamps) {
      // Single video export
      const storageKey = `timestamps_${data.video.videoId}`;
      await chrome.storage.local.set({ [storageKey]: data.timestamps });
      
      // Import video metadata
      const metaKey = `video_meta_${data.video.videoId}`;
      await chrome.storage.local.set({ [metaKey]: data.video });
    }
    
    alert('Import successful!');
    await loadAllVideos();
    renderVideos();
    
  } catch (error) {
    alert('Import failed: ' + error.message);
    console.error('Import error:', error);
  }
  
  // Reset file input
  e.target.value = '';
}

// Delete a video and all its notes
async function deleteVideo(videoId) {
  const video = allVideos.find(v => v.videoId === videoId);
  if (!video) return;
  
  if (!confirm(`Delete all notes for "${video.title}"?`)) {
    return;
  }
  
  const storageKey = `timestamps_${videoId}`;
  const metaKey = `video_meta_${videoId}`;
  
  await chrome.storage.local.remove([storageKey, metaKey]);
  
  await loadAllVideos();
  renderVideos();
}

// Delete a single note
async function deleteNote(videoId, noteId) {
  if (!confirm('Delete this note?')) {
    return;
  }
  
  const storageKey = `timestamps_${videoId}`;
  const result = await chrome.storage.local.get(storageKey);
  let timestamps = result[storageKey] || [];
  
  timestamps = timestamps.filter(ts => ts.id !== noteId);
  
  if (timestamps.length === 0) {
    // If no more notes, delete the video entirely
    await chrome.storage.local.remove(storageKey);
    const metaKey = `video_meta_${videoId}`;
    await chrome.storage.local.remove(metaKey);
  } else {
    await chrome.storage.local.set({ [storageKey]: timestamps });
    
    // Update metadata
    const metaKey = `video_meta_${videoId}`;
    const metaResult = await chrome.storage.local.get(metaKey);
    const videoMeta = metaResult[metaKey] || {};
    videoMeta.noteCount = timestamps.length;
    videoMeta.updatedAt = new Date().toISOString();
    await chrome.storage.local.set({ [metaKey]: videoMeta });
  }
  
  await loadAllVideos();
  renderVideos();
}

// Helper function to download JSON
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
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
