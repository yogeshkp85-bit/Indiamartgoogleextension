/**
 * IndiaMart Lead Autoclick Pro - Background Service Worker
 */

import { StorageManager } from './utils/storage.js';

// Setup alarms on installation
chrome.runtime.onInstalled.addListener(async () => {
  // Initialize defaults
  const state = await StorageManager.getState();
  updateBadge(state);

  // Setup periodic check for midnight rollover
  chrome.alarms.create('midnightResetCheck', {
    periodInMinutes: 30
  });
});

// Periodic alarm handler for midnight rollover
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'midnightResetCheck') {
    const state = await StorageManager.getState();
    updateBadge(state);
  }
});

// Dynamic injection listener: only inject if content script is NOT already active on the tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab && tab.url) {
    const url = tab.url.toLowerCase();
    if (url.includes('tradeindia.com') || url.includes('indiamart.com')) {
      chrome.tabs.sendMessage(tabId, { action: 'GET_CONTENT_STATUS' }, (resp) => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript({
            target: { tabId },
            files: [
              'utils/audio.js',
              'utils/locations_data.js',
              'content/parser.js',
              'content/tradeindia_parser.js',
              'content/matcher.js',
              'content/content.js'
            ]
          }).catch(() => {});
          chrome.scripting.insertCSS({
            target: { tabId },
            files: ['content/content.css']
          }).catch(() => {});
        }
      });
    }
  }
});

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'RECORD_CLICK') {
    // Report click to local web dashboard
    try {
      fetch('http://127.0.0.1:8080/api/record_click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.data || {})
      }).catch(() => {});
    } catch (e) {}

    StorageManager.recordClick(request.data).then(({ stats }) => {
      updateBadge({ stats });
      sendResponse({ success: true, stats });
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'UPDATE_BADGE') {
    StorageManager.getState().then((state) => {
      updateBadge(state);
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'RESET_TODAY_CLICKS') {
    StorageManager.getState().then(async (state) => {
      state.stats.clicksToday = 0;
      state.clickedLeadIds = [];
      state.history = [];
      if (state.keywords) {
        state.keywords.forEach(k => { k.clicksToday = 0; });
      }
      await StorageManager.saveState({
        stats: state.stats,
        clickedLeadIds: [],
        history: [],
        keywords: state.keywords
      });
      updateBadge(state);
      sendResponse({ success: true, stats: state.stats });
    });
    return true;
  }
});

function updateBadge(state) {
  try {
    const clicks = state.stats ? state.stats.clicksToday : 0;
    const text = clicks > 0 ? String(clicks) : '';
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#16a34a' });
  } catch (e) {
    // Ignore in non-active contexts
  }
}

// -------------------------------------------------------------
// LIVE WEB DASHBOARD SYNC (POLLS LOCAL DASHBOARD EVERY 10 SECONDS)
// -------------------------------------------------------------
let lastSyncedVersion = 0;
async function syncFromDashboard() {
  try {
    const res = await fetch('http://127.0.0.1:8080/api/config');
    if (!res.ok) return;
    const cfg = await res.json();
    if (cfg && cfg.version && cfg.version > lastSyncedVersion) {
      lastSyncedVersion = cfg.version;
      console.log('[DASHBOARD SYNC] Loaded config v' + cfg.version + ' from Web Dashboard');
      await StorageManager.saveState({
        settings: cfg.settings,
        keywords: cfg.keywords,
        negativeKeywords: cfg.negativeKeywords,
        locations: cfg.locations,
        blockedLocations: cfg.blockedLocations
      });
      const updated = await StorageManager.getState();
      updateBadge(updated);
    }
  } catch (e) {
    // Dashboard not running yet
  }
}

// Poll every 10 seconds
setInterval(syncFromDashboard, 10000);
syncFromDashboard();

