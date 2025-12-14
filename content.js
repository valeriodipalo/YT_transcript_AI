// Content script that runs on YouTube pages
// This script communicates with the popup to get video information and timestamps

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideoInfo') {
    const videoInfo = getVideoInfo();
    sendResponse(videoInfo);
  } else if (request.action === 'seekToTime') {
    seekToTime(request.time);
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});

// Get current video information
function getVideoInfo() {
  const video = document.querySelector('video');
  
  if (!video) {
    return {
      isYouTube: false,
      currentTime: 0,
      duration: 0,
      title: 'No video detected',
      videoId: null
    };
  }

  // Get video ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');

  // Get video title
  const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer') || 
                       document.querySelector('yt-formatted-string.style-scope.ytd-watch-metadata');
  const title = titleElement ? titleElement.textContent.trim() : 'YouTube Video';

  return {
    isYouTube: true,
    currentTime: video.currentTime,
    duration: video.duration,
    title: title,
    videoId: videoId,
    url: window.location.href
  };
}

// Seek video to specific time
function seekToTime(time) {
  const video = document.querySelector('video');
  if (video) {
    video.currentTime = time;
    // Ensure video is playing
    if (video.paused) {
      video.play();
    }
  }
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
