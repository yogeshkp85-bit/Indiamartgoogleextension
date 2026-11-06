/**
 * TradeIndia Lead Autoclick Pro - Resilient DOM Parser & Action Adapter
 * Supports TradeIndia's MTI split-view (Master-Detail) Buy Trade Leads layout:
 * - Scans left-side lead cards (title, buyer, MOQ, location, date).
 * - Clicks to select lead card in left list to render right-side detail pane.
 * - Detects right-side detail pane and clicks "View Details" to claim lead with allocated quota.
 * - Handles optional confirmation dialogs ("Are you sure you want to consume 1 Buy Lead?").
 */

(function () {
  'use strict';

  if (typeof window !== 'undefined' && window.TradeIndiaParser) {
    return;
  }

  class TradeIndiaParser {
  /**
   * Find all lead card elements in TradeIndia's left-side list
   */
  static findLeadCards() {
    // Strategy 1: Known TradeIndia card classes / list items
    const explicitCards = Array.from(document.querySelectorAll(
      '.lead-card, .lead-item, .inquiry-card, .inquiry-item, [class*="lead_item"], [class*="leadItem"], [class*="inquiry_item"], [class*="inquiryItem"], .card-lead, .buy-lead-item'
    )).filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

    if (explicitCards.length > 0) {
      return explicitCards;
    }

    // Strategy 2: Heuristic detection using MOQ pattern in the left half of viewport
    // In TradeIndia, every Buy Trade Lead card contains "MOQ" or "MOQ -"
    const allDivs = Array.from(document.querySelectorAll('div, li, article, section'));
    const midX = window.innerWidth * 0.55;
    const detectedCards = [];
    const seenElements = new Set();

    for (const el of allDivs) {
      if (el.children.length > 10) continue; // Skip large list wrappers
      const text = el.innerText || el.textContent || '';
      if (!/MOQ\s*[-:]/i.test(text)) continue;

      // Find enclosing card container in left column
      let current = el;
      let cardContainer = null;
      while (current && current !== document.body && current !== document.documentElement) {
        const rect = current.getBoundingClientRect();
        // Lead card list is in the left column (left < midX and typical card dimensions)
        if (rect.left < midX && rect.width >= 160 && rect.width <= 580 && rect.height >= 40 && rect.height <= 320) {
          cardContainer = current;
          break;
        }
        current = current.parentElement;
      }

      if (cardContainer && !seenElements.has(cardContainer)) {
        seenElements.add(cardContainer);
        detectedCards.push(cardContainer);
      }
    }

    if (detectedCards.length > 0) {
      return detectedCards;
    }

    // Strategy 3: List items inside scrollable left-panel containers
    const listContainers = document.querySelectorAll('[class*="lead-list"], [class*="leadList"], [class*="inquiryList"], [class*="inquiry_list"], #inquiry_list, .left-section');
    for (const container of listContainers) {
      const items = Array.from(container.children).filter(child => {
        const text = (child.innerText || '').toLowerCase();
        return text.includes('moq') && child.offsetWidth > 0;
      });
      if (items.length > 0) return items;
    }

    return [];
  }

  /**
   * Extract structured lead data from a TradeIndia card
   */
  static parseCard(cardEl) {
    if (!cardEl) return null;
    const fullText = (cardEl.innerText || cardEl.textContent || '').replace(/\s+/g, ' ').trim();
    if (!fullText) return null;

    // 1. Title Extraction
    let title = '';
    const headingEl = cardEl.querySelector('h1, h2, h3, h4, h5, [class*="title"], [class*="subject"], [class*="product"], a, strong');
    if (headingEl) {
      const hText = (headingEl.innerText || headingEl.textContent || '').trim();
      if (hText && !/^(MOQ|Unread|Search|Buy Trade Leads)/i.test(hText)) {
        title = hText;
      }
    }
    if (!title) {
      // Fallback: first prominent text line
      const lines = fullText.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
      title = lines[0] || 'TradeIndia Requirement';
    }

    // Clean title from timestamps, buyer avatars or attached MOQ
    title = title.replace(/\b\d+\s+(?:hours?|days?|mins?|minutes?)\s+ago\b/gi, '')
      .replace(/\bMOQ\s*[-:].*$/i, '')
      .trim();

    // 2. Quantity & Unit from MOQ
    let quantity = 1;
    let unit = 'Piece';
    const moqMatch = fullText.match(/MOQ\s*[-:]?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*([a-zA-Z\/]+)?/i);
    if (moqMatch) {
      quantity = parseFloat(moqMatch[1].replace(/,/g, '')) || 1;
      if (moqMatch[2] && moqMatch[2].trim()) {
        unit = moqMatch[2].trim();
      }
    }

    // 3. Location Extraction
    let locationStr = '';
    // Look for element near map-marker icon
    const locIconEl = cardEl.querySelector('[class*="map"], [class*="marker"], [class*="location"], [class*="city"], svg');
    if (locIconEl && locIconEl.parentElement) {
      const iconParentText = locIconEl.parentElement.innerText.trim();
      if (iconParentText && iconParentText.length < 40 && !iconParentText.includes('MOQ')) {
        locationStr = iconParentText;
      }
    }

    // Scan for Indian cities / states known in IndiaLocationsManager
    try {
      if (typeof IndiaLocationsManager !== 'undefined') {
        const textLower = fullText.toLowerCase();
        const citiesMap = (typeof window !== 'undefined' && window.INDIA_STATES_AND_CITIES)
          ? window.INDIA_STATES_AND_CITIES
          : (typeof INDIA_STATES_AND_CITIES !== 'undefined' ? INDIA_STATES_AND_CITIES : {});

        for (const [st, cities] of Object.entries(citiesMap)) {
          for (const city of cities) {
            if (textLower.includes(city.toLowerCase())) {
              locationStr = `${city}, ${st}`;
              break;
            }
          }
          if (locationStr) break;
        }

        // If city not found, try all states
        if (!locationStr && typeof IndiaLocationsManager.getAllStatesAndUTs === 'function') {
          for (const st of IndiaLocationsManager.getAllStatesAndUTs()) {
            if (textLower.includes(st.toLowerCase())) {
              locationStr = st;
              break;
            }
          }
        }
      }
    } catch (locErr) {
      console.warn('[TI-Autoclick] Location parse fallback:', locErr);
    }

    if (!locationStr) {
      locationStr = 'India';
    }

    // 4. Buyer Name
    let buyerName = '';
    const userMatch = fullText.match(/(?:👤|Avatar|[A-Z]\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:📍|Rohtak|Lucknow|Delhi|[A-Z][a-z]+)/);
    if (userMatch) {
      buyerName = userMatch[1].trim();
    }

    // 5. Timestamp
    const timeMatch = fullText.match(/(\d+\s+(?:hours?|days?|minutes?|mins?)\s+ago|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    const timestamp = timeMatch ? timeMatch[1] : '';

    // 6. Lead ID
    const cardIdAttr = cardEl.getAttribute('data-id') ||
      cardEl.getAttribute('data-inquiry-id') ||
      cardEl.getAttribute('data-lead-id') ||
      cardEl.id;
    const cleanSig = (title + '_' + (buyerName || '') + '_' + (locationStr || '') + '_' + timestamp).toLowerCase().replace(/[^a-z0-9]/g, '');
    const leadId = cardIdAttr ? `ti-${cardIdAttr}` : `ti-${cleanSig.slice(0, 32)}`;

    // 7. Check if card is marked as Read or already in account
    let isRead = false;
    const cardClass = (cardEl.className || '').toLowerCase();
    if (
      (cardClass.includes('read') && !cardClass.includes('unread')) ||
      cardClass.includes('viewed') ||
      cardClass.includes('contacted') ||
      cardEl.getAttribute('data-read') === '1' ||
      cardEl.getAttribute('data-read') === 'true' ||
      cardEl.getAttribute('data-status') === 'read' ||
      cardEl.getAttribute('data-is-read') === '1'
    ) {
      isRead = true;
    }

    // 8. Clickable Element (to select card in the left list)
    const clickableElement = cardEl.querySelector('a, h2, h3, h4, h5, [class*="title"]') || cardEl;

    return {
      portal: 'TradeIndia',
      leadId,
      title,
      rawText: fullText,
      buyerName,
      location: locationStr,
      quantity,
      unit,
      orderValue: 0,
      timestamp,
      isExport: false,
      country: 'India',
      isRetail: false,
      isRecommendation: false,
      isRead,
      verifications: { phone: true, gst: false, email: false, whatsapp: false, website: false },
      element: cardEl,
      clickableElement,
      button: clickableElement // Satisfies matcher.js and general lead checks
    };
  }

  /**
   * Ensure that TradeIndia list is filtered to "Unread" leads
   * Automatically switches the filter dropdown to "Unread" if set to "All" or "Read"
   */
  static async ensureUnreadFilterActive() {
    try {
      // 1. Check all native select elements on the page (filter dropdown)
      const selects = Array.from(document.querySelectorAll('select'));
      for (const sel of selects) {
        const options = Array.from(sel.options);
        const unreadOpt = options.find(o => o.text.trim().toLowerCase().includes('unread') || o.value.toLowerCase().includes('unread'));
        if (unreadOpt) {
          if (sel.value !== unreadOpt.value) {
            console.log('[TI-Autoclick] Auto-switching filter select to Unread:', unreadOpt.value);
            sel.value = unreadOpt.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            sel.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 600));
            return true;
          }
          return false; // Already on unread
        }
      }

      // 2. Check custom dropdown buttons / pills (e.g. Bootstrap or custom div dropdowns)
      const midX = window.innerWidth * 0.55;
      const filterCandidates = Array.from(document.querySelectorAll(
        'button, [class*="dropdown"], [class*="filter"], [class*="select"], [role="button"], span'
      )).filter(el => {
        const r = el.getBoundingClientRect();
        return r.left < midX && r.top < 300 && el.offsetWidth > 0 && el.offsetHeight > 0;
      });

      for (const el of filterCandidates) {
        const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
        // If the dropdown currently shows "All" or "Read", switch it to "Unread"
        if (txt === 'all' || txt === 'all leads' || txt === 'read') {
          console.log('[TI-Autoclick] Filter is currently "' + txt + '". Clicking to switch to Unread...');
          el.click();
          await new Promise(r => setTimeout(r, 350));

          // Look for option "Unread" in the opened menu
          const menuItems = Array.from(document.querySelectorAll('a, button, li, div, span'));
          for (const item of menuItems) {
            const itemText = (item.innerText || item.textContent || '').trim().toLowerCase();
            if (itemText === 'unread' || itemText === 'unread leads') {
              item.click();
              console.log('[TI-Autoclick] Successfully selected "Unread" filter option.');
              await new Promise(r => setTimeout(r, 600));
              return true;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[TI-Autoclick] ensureUnreadFilterActive error:', err);
    }
    return false;
  }

  /**
   * Check if lead in the right detail pane is already claimed / already in our account
   * Signs:
   * 1. Phone number is unmasked (no asterisks).
   * 2. No "View Details" button exists.
   * 3. Badges like "Already Viewed", "Contacted", "Details Viewed".
   */
  static isLeadAlreadyInAccount() {
    try {
      const detailContainer = document.querySelector('[class*="detail"], .right-section, #detail_view, main') || document.body;
      const text = (detailContainer.innerText || detailContainer.textContent || '').toLowerCase();

      // Check for unmasked mobile number: standard Indian mobile without asterisks
      const hasMaskedPhone = /\+?91\d{2}\*{3,}/.test(text);
      const hasUnmaskedPhone = /\+?91[\s-]?[6-9]\d{9}\b/.test(text) && !hasMaskedPhone;

      // Check for already claimed/viewed badge
      const hasClaimedText = /already\s+(?:viewed|contacted|purchased|claimed)|details\s+viewed|contact\s+buyer/i.test(text);

      // Check if "View Details" button is absent
      const viewBtn = TradeIndiaParser.findViewDetailsButton();

      if (hasUnmaskedPhone || (hasClaimedText && !viewBtn) || !viewBtn) {
        return true;
      }
    } catch (err) {
      console.warn('[TI-Autoclick] isLeadAlreadyInAccount check error:', err);
    }
    return false;
  }
}

  /**
   * Search for the "View Details" button in the right detail pane
   */
  static findViewDetailsButton() {
  const clickables = Array.from(document.querySelectorAll(
    'button, a, input[type="button"], input[type="submit"], div[role="button"], span.btn, span'
  )).filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

  for (const el of clickables) {
    const text = (el.innerText || el.textContent || el.value || '').trim().replace(/\s+/g, ' ').toLowerCase();
    if (text === 'view details' || text === 'view detail' || text.startsWith('view details')) {
      return el;
    }
  }
  return null;
}

  /**
   * Poll for the "View Details" button to appear in the right pane after card selection
   */
  static async waitForViewDetailsButton(timeoutMs = 3500) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const btn = TradeIndiaParser.findViewDetailsButton();
    if (btn) return btn;
    await new Promise(r => setTimeout(r, 200));
  }
  return null;
}

  /**
   * Check and confirm any quota consumption popup ("Are you sure you want to consume 1 Buy Lead?")
   */
  static async handleConfirmationModal(timeoutMs = 2500) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    await new Promise(r => setTimeout(r, 200));
    const modals = Array.from(document.querySelectorAll(
      '.modal, .popup, [role="dialog"], .swal2-modal, .swal-modal, [class*="confirm"], [class*="dialog"]'
    )).filter(m => m.offsetWidth > 0 && m.offsetHeight > 0);

    for (const modal of modals) {
      const buttons = Array.from(modal.querySelectorAll('button, a, input[type="button"], span.btn'));
      for (const btn of buttons) {
        const btnText = (btn.innerText || btn.textContent || btn.value || '').trim().toLowerCase();
        if (
          btnText === 'confirm' ||
          btnText === 'yes' ||
          btnText === 'proceed' ||
          btnText === 'ok' ||
          btnText.includes('view details') ||
          btnText.includes('consume')
        ) {
          console.log('[TI-Autoclick] Found modal confirmation button:', btnText);
          btn.click();
          await new Promise(r => setTimeout(r, 400));
          return true;
        }
      }
    }
  }
  return false;
}
}

if (typeof window !== 'undefined') {
  window.TradeIndiaParser = TradeIndiaParser;
}
})();

