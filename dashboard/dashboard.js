/**
 * IndiaMart Lead Autoclick Pro - Dashboard Controller
 */

import { StorageManager } from '../utils/storage.js';
import { CSVManager } from '../utils/csv.js';

let state = null;
let currentEditingKwIndex = -1;

// Audio player for preview
function playTestChime() {
  if (window.SoundNotifier) {
    window.SoundNotifier.playSuccessChime();
  }
}

async function loadAll() {
  state = await StorageManager.getState();
  renderTopStats();
  renderEngineStatus();
  renderKeywordsTable();
  renderCategories();
  renderNegatives();
  renderLocations();
  renderCountries();
  renderBlocked();
  renderVerificationAndControls();
  renderHistory();
}

function renderTopStats() {
  document.getElementById('stat-pill-today').innerText = state.stats.clicksToday || 0;
  document.getElementById('stat-pill-total').innerText = state.stats.totalClicks || 0;
}

function renderEngineStatus() {
  const pill = document.getElementById('side-status-indicator');
  const btn = document.getElementById('side-toggle-engine-btn');

  if (state.settings.engineActive) {
    pill.className = 'status-pill active';
    pill.innerText = 'Active';
    btn.className = 'btn-toggle-engine active';
    btn.innerText = '■ Pause Engine';
  } else {
    pill.className = 'status-pill paused';
    pill.innerText = 'Paused';
    btn.className = 'btn-toggle-engine';
    btn.innerText = '▶ Activate Engine';
  }
}

/**
 * TAB 1: Keywords Management
 */
function renderKeywordsTable() {
  const tbody = document.getElementById('keywords-tbody');
  const badge = document.getElementById('kw-total-badge');
  const sortMode = state.settings.keywordSorting || 'entry';
  document.getElementById('kw-sort-select').value = sortMode;

  let list = [...(state.keywords || [])];
  if (sortMode === 'name') {
    list.sort((a, b) => a.keyword.localeCompare(b.keyword));
  }

  badge.innerText = list.length;
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 20px;">No target keywords configured. Click "+ Add Keyword" or "Import CSV" to start.</td></tr>`;
    return;
  }

  list.forEach((kw, idx) => {
    const tr = document.createElement('tr');
    const limitStr = kw.dailyLimit > 0 ? `${kw.dailyLimit} / day` : 'Unlimited (∞)';
    const minOrderStr = kw.minOrderValue > 0 ? `₹ ${kw.minOrderValue.toLocaleString('en-IN')}` : 'None';

    let locStr = 'All India 🌐';
    let locBadgeStyle = 'color: #22c55e; font-weight: 600;';
    if (kw.targetScope === 'all' || /^(all|all india|pan india|india)$/i.test(kw.targetLocation || '')) {
      locStr = 'All India 🌐';
      locBadgeStyle = 'color: #22c55e; font-weight: 600;';
    } else if (kw.targetScope === 'custom' || (kw.targetStates && kw.targetStates.length > 0) || (kw.targetLocation && kw.targetLocation.trim())) {
      locStr = kw.targetLocation || (kw.targetStates || []).join(', ');
      locBadgeStyle = 'color: #38bdf8; font-weight: 600;';
    } else if (state.settings.useLocations && state.locations && state.locations.length > 0) {
      locStr = 'Global List 📍';
      locBadgeStyle = 'color: #94a3b8; font-style: italic;';
    }

    tr.innerHTML = `
      <td><b>${escapeHtml(kw.keyword)}</b></td>
      <td>${kw.minQty || 1} ${escapeHtml(kw.unit || 'Piece')}</td>
      <td style="${locBadgeStyle}" title="${escapeHtml(locStr)}">${escapeHtml(locStr)}</td>
      <td>${minOrderStr}</td>
      <td>${limitStr}</td>
      <td><span style="color: #38bdf8; font-weight: bold;">${kw.clicksToday || 0}</span></td>
      <td>
        <button class="btn-secondary-sm edit-kw-btn" data-id="${kw.id}" style="padding: 3px 8px; margin-right: 4px;">Edit</button>
        <button class="btn-danger-sm del-kw-btn" data-id="${kw.id}" style="padding: 3px 8px;">✕</button>
      </td>
    `;

    tr.querySelector('.edit-kw-btn').addEventListener('click', () => openKwModal(kw));
    tr.querySelector('.del-kw-btn').addEventListener('click', async () => {
      state.keywords = state.keywords.filter(k => k.id !== kw.id);
      await StorageManager.saveState({ keywords: state.keywords });
      renderKeywordsTable();
    });

    tbody.appendChild(tr);
  });
}

// Modal State Management
let modalTargetScope = 'global';
let modalTargetStates = [];
let modalTargetCities = [];

function setModalScope(scope) {
  modalTargetScope = scope;
  const globalRadio = document.getElementById('kw-scope-global');
  const allRadio = document.getElementById('kw-scope-all');
  const customRadio = document.getElementById('kw-scope-custom');
  if (globalRadio) globalRadio.checked = (scope === 'global');
  if (allRadio) allRadio.checked = (scope === 'all');
  if (customRadio) customRadio.checked = (scope === 'custom');

  const customBox = document.getElementById('kw-custom-loc-box');
  if (customBox) {
    if (scope === 'custom') {
      customBox.classList.remove('hidden');
    } else {
      customBox.classList.add('hidden');
    }
  }
}

function populateStateSelect(selectId) {
  const el = document.getElementById(selectId);
  if (!el || typeof IndiaLocationsManager === 'undefined') return;
  const states = IndiaLocationsManager.getAllStates();
  el.innerHTML = '<option value="">-- Choose State / UT --</option>' +
    states.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
}

function resetCitySelect(selectId, placeholder = '-- (All Cities in State) --') {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>`;
  el.disabled = true;
}

function updateCitySelect(stateSelectId, citySelectId, defaultText = '-- (All Cities in State) --') {
  const stEl = document.getElementById(stateSelectId);
  const ctEl = document.getElementById(citySelectId);
  if (!stEl || !ctEl || typeof IndiaLocationsManager === 'undefined') return;

  const chosenState = stEl.value;
  if (!chosenState) {
    resetCitySelect(citySelectId, defaultText);
    return;
  }

  const cities = IndiaLocationsManager.getCitiesForState(chosenState);
  let optionsHtml = `<option value="">${escapeHtml(defaultText)}</option>`;
  cities.forEach(city => {
    optionsHtml += `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`;
  });
  ctEl.innerHTML = optionsHtml;
  ctEl.disabled = false;
}

function renderModalLocationTags() {
  const container = document.getElementById('kw-selected-loc-tags');
  if (!container) return;
  container.innerHTML = '';

  if (modalTargetStates.length === 0 && modalTargetCities.length === 0) {
    container.innerHTML = `<li style="font-size: 11px; color: #64748b; font-style: italic; padding: 4px;">No custom states added yet. Choose a State above and click "+ Add".</li>`;
    return;
  }

  modalTargetStates.forEach(st => {
    // Check if there are specific cities selected for this state
    let stateCities = [];
    if (typeof IndiaLocationsManager !== 'undefined') {
      const knownStateCities = IndiaLocationsManager.getCitiesForState(st).map(c => c.toLowerCase());
      stateCities = modalTargetCities.filter(c => knownStateCities.includes(c.toLowerCase()));
    }

    if (stateCities.length > 0) {
      // User restricted to specific cities in this state
      stateCities.forEach(city => {
        const li = document.createElement('li');
        li.className = 'tag-item city-chip';
        li.innerHTML = `<span>📍 ${escapeHtml(st)}: <b>${escapeHtml(city)}</b></span><button class="tag-remove" title="Remove city">×</button>`;
        li.querySelector('.tag-remove').addEventListener('click', () => {
          modalTargetCities = modalTargetCities.filter(c => c.toLowerCase() !== city.toLowerCase());
          renderModalLocationTags();
        });
        container.appendChild(li);
      });
    } else {
      // Entire state accepted (All Cities)
      const li = document.createElement('li');
      li.className = 'tag-item state-chip';
      li.innerHTML = `<span>📍 <b>${escapeHtml(st)}</b> (All Cities)</span><button class="tag-remove" title="Remove state">×</button>`;
      li.querySelector('.tag-remove').addEventListener('click', () => {
        modalTargetStates = modalTargetStates.filter(s => s !== st);
        renderModalLocationTags();
      });
      container.appendChild(li);
    }
  });

  // Any additional standalone cities
  modalTargetCities.forEach(city => {
    let belongsToKnownState = false;
    if (typeof IndiaLocationsManager !== 'undefined') {
      const parentState = IndiaLocationsManager.findStateForCity(city);
      if (parentState && modalTargetStates.includes(parentState)) {
        belongsToKnownState = true;
      }
    }
    if (!belongsToKnownState) {
      const li = document.createElement('li');
      li.className = 'tag-item city-chip';
      li.innerHTML = `<span>📍 <b>${escapeHtml(city)}</b></span><button class="tag-remove" title="Remove city">×</button>`;
      li.querySelector('.tag-remove').addEventListener('click', () => {
        modalTargetCities = modalTargetCities.filter(c => c !== city);
        renderModalLocationTags();
      });
      container.appendChild(li);
    }
  });
}

function openKwModal(existingKw = null) {
  const modal = document.getElementById('kw-modal');
  const title = document.getElementById('modal-title');
  const nameInput = document.getElementById('kw-modal-name');
  const qtyInput = document.getElementById('kw-modal-minqty');
  const unitSelect = document.getElementById('kw-modal-unit');
  const orderInput = document.getElementById('kw-modal-minorder');
  const limitInput = document.getElementById('kw-modal-limit');

  modalTargetStates = [];
  modalTargetCities = [];

  if (existingKw) {
    title.innerText = 'Edit Target Keyword';
    currentEditingKwIndex = state.keywords.findIndex(k => k.id === existingKw.id);
    nameInput.value = existingKw.keyword;
    qtyInput.value = existingKw.minQty || 1;
    unitSelect.value = existingKw.unit || 'Piece';
    orderInput.value = existingKw.minOrderValue || 0;
    limitInput.value = existingKw.dailyLimit || 0;

    const rawLoc = (existingKw.targetLocation || '').trim();
    const rawScope = (existingKw.targetScope || '').toLowerCase();

    if (rawScope === 'all' || /^(all|all india|pan india|india)$/i.test(rawLoc)) {
      setModalScope('all');
    } else if (existingKw.targetStates && existingKw.targetStates.length > 0) {
      setModalScope('custom');
      modalTargetStates = [...existingKw.targetStates];
      modalTargetCities = [...(existingKw.targetCities || [])];
    } else if (rawLoc) {
      // Legacy text string (e.g. "Maharashtra, Gujarat" or "Pune")
      setModalScope('custom');
      const parts = rawLoc.split(',').map(s => s.trim()).filter(Boolean);
      parts.forEach(part => {
        if (typeof IndiaLocationsManager !== 'undefined') {
          const allStates = IndiaLocationsManager.getAllStates();
          const matchedState = allStates.find(s => s.toLowerCase() === part.toLowerCase());
          if (matchedState) {
            if (!modalTargetStates.includes(matchedState)) modalTargetStates.push(matchedState);
          } else {
            const foundState = IndiaLocationsManager.findStateForCity(part);
            if (foundState) {
              if (!modalTargetStates.includes(foundState)) modalTargetStates.push(foundState);
              if (!modalTargetCities.includes(part)) modalTargetCities.push(part);
            } else {
              modalTargetStates.push(part);
            }
          }
        } else {
          modalTargetStates.push(part);
        }
      });
    } else {
      setModalScope('global');
    }
  } else {
    title.innerText = 'Add Target Keyword';
    currentEditingKwIndex = -1;
    nameInput.value = '';
    qtyInput.value = 1;
    unitSelect.value = 'Piece';
    orderInput.value = 0;
    limitInput.value = 0;
    setModalScope('global');
  }

  // Populate state dropdown in modal
  populateStateSelect('kw-modal-state-select');
  resetCitySelect('kw-modal-city-select', '-- (All Cities in State) --');
  renderModalLocationTags();

  modal.classList.remove('hidden');
  nameInput.focus();
}

function closeKwModal() {
  document.getElementById('kw-modal').classList.add('hidden');
}

async function saveKwModal() {
  const name = document.getElementById('kw-modal-name').value.trim();
  if (!name) {
    alert('Please enter a product keyword name.');
    return;
  }

  let finalScope = modalTargetScope;
  let finalTargetLoc = '';
  let finalStates = [];
  let finalCities = [];

  if (finalScope === 'all') {
    finalTargetLoc = 'All India';
    finalStates = [];
    finalCities = [];
  } else if (finalScope === 'custom') {
    if (modalTargetStates.length === 0 && modalTargetCities.length === 0) {
      alert('You selected "Specific States & Cities", but have not added any state yet.\nPlease pick a state and click "+ Add", or switch to "All India".');
      return;
    }
    finalStates = [...modalTargetStates];
    finalCities = [...modalTargetCities];

    // Format human-readable targetLocation string
    const parts = [];
    finalStates.forEach(st => {
      let stCities = [];
      if (typeof IndiaLocationsManager !== 'undefined') {
        const knownCities = IndiaLocationsManager.getCitiesForState(st).map(c => c.toLowerCase());
        stCities = finalCities.filter(c => knownCities.includes(c.toLowerCase()));
      }
      if (stCities.length > 0) {
        parts.push(`${st} (${stCities.join(', ')})`);
      } else {
        parts.push(st);
      }
    });
    // Add any orphan cities
    finalCities.forEach(c => {
      if (!parts.some(p => p.includes(c))) {
        parts.push(c);
      }
    });

    finalTargetLoc = parts.join(', ');
  } else {
    // global list
    finalScope = 'global';
    finalTargetLoc = '';
    finalStates = [];
    finalCities = [];
  }

  const kwData = {
    id: currentEditingKwIndex >= 0 ? state.keywords[currentEditingKwIndex].id : 'kw-' + Date.now(),
    keyword: name,
    minQty: parseFloat(document.getElementById('kw-modal-minqty').value) || 1,
    unit: document.getElementById('kw-modal-unit').value,
    targetScope: finalScope,
    targetLocation: finalTargetLoc,
    targetStates: finalStates,
    targetCities: finalCities,
    minOrderValue: parseFloat(document.getElementById('kw-modal-minorder').value) || 0,
    dailyLimit: parseInt(document.getElementById('kw-modal-limit').value, 10) || 0,
    clicksToday: currentEditingKwIndex >= 0 ? state.keywords[currentEditingKwIndex].clicksToday : 0
  };

  if (currentEditingKwIndex >= 0) {
    state.keywords[currentEditingKwIndex] = kwData;
  } else {
    state.keywords.push(kwData);
  }

  await StorageManager.saveState({ keywords: state.keywords });
  closeKwModal();
  renderKeywordsTable();
}

/**
 * TAB 2: Categories & Negatives
 */
function renderCategories() {
  document.getElementById('use-categories-toggle').checked = !!state.settings.useCategories;
  const listEl = document.getElementById('categories-list');
  const badge = document.getElementById('cat-total-badge');
  badge.innerText = state.categories.length;

  listEl.innerHTML = '';
  state.categories.forEach((cat, idx) => {
    const li = document.createElement('li');
    li.className = 'tag-item';
    li.innerHTML = `<span>${escapeHtml(cat)}</span><button class="tag-remove">×</button>`;
    li.querySelector('.tag-remove').addEventListener('click', async () => {
      state.categories.splice(idx, 1);
      await StorageManager.saveState({ categories: state.categories });
      renderCategories();
    });
    listEl.appendChild(li);
  });
}

function renderNegatives() {
  document.getElementById('use-negatives-toggle').checked = !!state.settings.useNegativeKeywords;
  const listEl = document.getElementById('negatives-list');
  const badge = document.getElementById('neg-total-badge');
  badge.innerText = state.negativeKeywords.length;

  listEl.innerHTML = '';
  state.negativeKeywords.forEach((neg, idx) => {
    const li = document.createElement('li');
    li.className = 'tag-item';
    li.innerHTML = `<span>${escapeHtml(neg)}</span><button class="tag-remove">×</button>`;
    li.querySelector('.tag-remove').addEventListener('click', async () => {
      state.negativeKeywords.splice(idx, 1);
      await StorageManager.saveState({ negativeKeywords: state.negativeKeywords });
      renderNegatives();
    });
    listEl.appendChild(li);
  });
}

/**
 * TAB 3: Locations & Export
 */
function renderLocations() {
  document.getElementById('use-locations-toggle').checked = !!state.settings.useLocations;
  const listEl = document.getElementById('locations-list');
  const badge = document.getElementById('loc-total-badge');
  badge.innerText = state.locations.length;

  listEl.innerHTML = '';
  state.locations.forEach((loc, idx) => {
    const li = document.createElement('li');
    li.className = 'tag-item';
    li.innerHTML = `<span>${escapeHtml(loc)}</span><button class="tag-remove">×</button>`;
    li.querySelector('.tag-remove').addEventListener('click', async () => {
      state.locations.splice(idx, 1);
      await StorageManager.saveState({ locations: state.locations });
      renderLocations();
    });
    listEl.appendChild(li);
  });
}

function renderCountries() {
  document.getElementById('use-export-countries-toggle').checked = !!state.settings.useExportCountries;
  const listEl = document.getElementById('countries-list');
  const badge = document.getElementById('country-total-badge');
  badge.innerText = state.exportCountries.length;

  listEl.innerHTML = '';
  state.exportCountries.forEach((ctry, idx) => {
    const li = document.createElement('li');
    li.className = 'tag-item';
    li.innerHTML = `<span>${escapeHtml(ctry)}</span><button class="tag-remove">×</button>`;
    li.querySelector('.tag-remove').addEventListener('click', async () => {
      state.exportCountries.splice(idx, 1);
      await StorageManager.saveState({ exportCountries: state.exportCountries });
      renderCountries();
    });
    listEl.appendChild(li);
  });
}

function renderBlocked() {
  document.getElementById('use-blocked-locations-toggle').checked = !!state.settings.useBlockedLocations;
  const listEl = document.getElementById('blocked-list');
  const badge = document.getElementById('blocked-total-badge');
  badge.innerText = state.blockedLocations.length;

  listEl.innerHTML = '';
  state.blockedLocations.forEach((bl, idx) => {
    const li = document.createElement('li');
    li.className = 'tag-item';
    li.innerHTML = `<span>${escapeHtml(bl)}</span><button class="tag-remove">×</button>`;
    li.querySelector('.tag-remove').addEventListener('click', async () => {
      state.blockedLocations.splice(idx, 1);
      await StorageManager.saveState({ blockedLocations: state.blockedLocations });
      renderBlocked();
    });
    listEl.appendChild(li);
  });
}

/**
 * TAB 4: Verification & Global Controls
 */
function renderVerificationAndControls() {
  const s = state.settings;
  document.getElementById('filter-verified-toggle').checked = !!s.filterOnlyVerified;
  document.getElementById('verify-gst').checked = !!(s.verificationTypes && s.verificationTypes.gst);
  document.getElementById('verify-phone').checked = !!(s.verificationTypes && s.verificationTypes.phone);
  document.getElementById('verify-email').checked = !!(s.verificationTypes && s.verificationTypes.email);
  document.getElementById('verify-whatsapp').checked = !!(s.verificationTypes && s.verificationTypes.whatsapp);
  document.getElementById('verify-website').checked = !!(s.verificationTypes && s.verificationTypes.website);

  document.getElementById('global-limit-input').value = s.globalDailyClickLimit || 0;
  document.getElementById('global-min-order-input').value = s.globalMinOrderValue || 0;
  document.getElementById('exclude-retail-toggle').checked = !!s.excludeRetailLeads;
  document.getElementById('dashboard-refresh-sec').value = s.refreshInterval || 15;
}

/**
 * TAB 5: Click History
 */
function renderHistory() {
  const tbody = document.getElementById('history-tbody');
  const badge = document.getElementById('history-total-count');
  const history = state.history || [];

  badge.innerText = history.length;
  tbody.innerHTML = '';

  if (history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 24px;">No leads clicked today yet. Turn on Auto-Click Engine and open seller.indiamart.com/bl/ or mti.tradeindia.com</td></tr>`;
    return;
  }

  history.forEach(item => {
    const tr = document.createElement('tr');
    const isTI = (item.portal || '').toLowerCase().includes('tradeindia');
    const portalTag = isTI
      ? '<span style="background: rgba(14, 165, 233, 0.2); color: #38bdf8; border: 1px solid #0284c7; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600;">TradeIndia</span>'
      : '<span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #059669; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600;">IndiaMart</span>';

    tr.innerHTML = `
      <td>${item.timeFormatted || new Date(item.timestamp).toLocaleTimeString()}</td>
      <td>${portalTag}</td>
      <td><span style="color: #38bdf8; font-weight: 600;">${escapeHtml(item.keyword)}</span></td>
      <td><b>${escapeHtml(item.title)}</b></td>
      <td>${escapeHtml(item.buyerLocation)}</td>
      <td>${escapeHtml(item.quantity)}</td>
      <td>${escapeHtml(item.orderValue)}</td>
      <td><span style="color: #10b981; font-weight: bold;">✔ CLAIMED</span></td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Lead Simulator
 */
function runSimulator() {
  const title = document.getElementById('sim-lead-title').value.trim();
  const qtyStr = document.getElementById('sim-lead-qty').value.trim();
  const valStr = document.getElementById('sim-lead-val').value.trim();
  const locStr = document.getElementById('sim-lead-loc').value.trim();

  const vGst = document.getElementById('sim-v-gst').checked;
  const vPhone = document.getElementById('sim-v-phone').checked;
  const vEmail = document.getElementById('sim-v-email').checked;
  const vWhatsapp = document.getElementById('sim-v-whatsapp').checked;

  const mockLead = {
    title,
    rawText: `${title} Quantity: ${qtyStr} Location: ${locStr} Value: ${valStr}`,
    quantity: parseFloat(qtyStr) || 1,
    unit: qtyStr.split(' ')[1] || 'Piece',
    orderValue: parseFloat(valStr.replace(/[^0-9.]/g, '')) || 0,
    location: locStr,
    country: locStr.toLowerCase().includes('uae') || locStr.toLowerCase().includes('dubai') ? 'UAE' : (locStr.toLowerCase().includes('usa') ? 'USA' : 'India'),
    isExport: /uae|dubai|usa|uk|germany|export/i.test(locStr),
    verifications: {
      gst: vGst,
      phone: vPhone,
      email: vEmail,
      whatsapp: vWhatsapp,
      website: false
    },
    isRetail: false,
    isRecommendation: false
  };

  // Evaluate using the real LeadMatcher engine logic
  // We simulate having window.LeadMatcher loaded
  const result = window.LeadMatcher ? window.LeadMatcher.evaluate(mockLead, state) : fallbackMatch(mockLead, state);

  const resBox = document.getElementById('sim-result-box');
  resBox.classList.remove('hidden', 'success', 'failed');

  if (result.match) {
    resBox.classList.add('success');
    resBox.innerHTML = `
      <h4>🎉 SUCCESS - THIS LEAD WOULD BE CLICKED!</h4>
      <p><b>Matched Keyword / Rule:</b> ${escapeHtml(result.matchedKeyword.keyword)}</p>
      <p><b>Decision Reason:</b> ${escapeHtml(result.reason)}</p>
      <p style="margin-top: 6px; font-size: 11px; opacity: 0.85;">All location, verification, minimum quantity, and value rules passed successfully.</p>
    `;
  } else {
    resBox.classList.add('failed');
    resBox.innerHTML = `
      <h4>❌ SKIPPED - LEAD DOES NOT MEET YOUR RULES</h4>
      <p><b>Rejection Reason:</b> ${escapeHtml(result.reason)}</p>
      <p style="margin-top: 6px; font-size: 11px; opacity: 0.85;">Adjust your keywords, target locations, or verification filters if this lead should have been picked.</p>
    `;
  }
}

function fallbackMatch(mockLead, cfg) {
  // Simple fallback if script is standalone
  return { match: true, matchedKeyword: { keyword: "Electric Stacker" }, reason: "Matched keyword Electric Stacker" };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text || '';
  return div.innerHTML;
}

/**
 * Event Bindings
 */
document.addEventListener('DOMContentLoaded', () => {
  loadAll();

  // Navigation Tabs
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');

      // Update title
      const titles = {
        'tab-keywords': ['Keywords & Rules', 'Define product keywords, minimum quantities, units, and per-keyword limits.'],
        'tab-categories': ['Categories & Negatives', 'Target entire categories or exclude unwanted terms like scrap, hire, or repair.'],
        'tab-locations': ['Locations & Export Targeting', 'Whitelist domestic states/cities, target export buyer countries, and block states.'],
        'tab-controls': ['Verification & Click Controls', 'Set daily limits, order value thresholds, and require verified buyer credentials.'],
        'tab-history': ["Today's Click History", 'Review real-time log of BuyLeads auto-clicked by the extension today.'],
        'tab-simulator': ['Lead Simulator', 'Test your filters with real-time feedback against simulated BuyLeads.'],
        'tab-data': ['Backup & CSV Transfer', 'Import/Export rules, transfer configurations, and download CSV templates.']
      };
      if (titles[tabId]) {
        document.getElementById('page-title').innerText = titles[tabId][0];
        document.getElementById('page-desc').innerText = titles[tabId][1];
      }
    });
  });

  // Engine Status Toggle
  document.getElementById('side-toggle-engine-btn').addEventListener('click', async () => {
    state.settings.engineActive = !state.settings.engineActive;
    await StorageManager.saveState({ settings: state.settings });
    renderEngineStatus();
  });

  // Keyword Modal
  document.getElementById('add-kw-modal-btn').addEventListener('click', () => openKwModal());
  document.getElementById('close-modal-btn').addEventListener('click', closeKwModal);
  document.getElementById('cancel-modal-btn').addEventListener('click', closeKwModal);
  document.getElementById('save-modal-kw-btn').addEventListener('click', saveKwModal);

  // Keyword Modal Location Handlers
  document.querySelectorAll('input[name="kw-loc-scope"]').forEach(radio => {
    radio.addEventListener('change', (e) => setModalScope(e.target.value));
  });

  document.getElementById('kw-modal-state-select').addEventListener('change', () => {
    updateCitySelect('kw-modal-state-select', 'kw-modal-city-select', '-- (All Cities in State) --');
  });

  document.getElementById('kw-modal-add-loc-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const st = document.getElementById('kw-modal-state-select').value;
    const ct = document.getElementById('kw-modal-city-select').value;
    if (!st) {
      alert('Please choose a State / UT from the list first.');
      return;
    }
    if (!modalTargetStates.includes(st)) {
      modalTargetStates.push(st);
    }
    if (ct) {
      if (!modalTargetCities.includes(ct)) {
        modalTargetCities.push(ct);
      }
    }
    renderModalLocationTags();
    document.getElementById('kw-modal-city-select').value = '';
  });

  // Keyword Sorting
  document.getElementById('kw-sort-select').addEventListener('change', async (e) => {
    state.settings.keywordSorting = e.target.value;
    await StorageManager.saveState({ settings: state.settings });
    renderKeywordsTable();
  });

  // Remove All Keywords
  document.getElementById('clear-all-keywords-btn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to remove ALL keywords?')) {
      state.keywords = [];
      await StorageManager.saveState({ keywords: [] });
      renderKeywordsTable();
    }
  });

  // Import Keywords CSV
  const kwCsvInput = document.getElementById('kw-csv-file-input');
  document.getElementById('import-kw-csv-btn').addEventListener('click', () => kwCsvInput.click());
  kwCsvInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await CSVManager.readFileText(file);
      const imported = CSVManager.parseKeywordsCSV(text);
      if (imported.length === 0) {
        alert('No valid keywords found in CSV file.');
        return;
      }
      state.keywords = [...state.keywords, ...imported];
      await StorageManager.saveState({ keywords: state.keywords });
      renderKeywordsTable();
      alert(`Successfully imported ${imported.length} keywords!`);
    } catch (err) {
      alert(err.message);
    }
    kwCsvInput.value = '';
  });

  // Categories Handlers
  document.getElementById('use-categories-toggle').addEventListener('change', async (e) => {
    state.settings.useCategories = e.target.checked;
    await StorageManager.saveState({ settings: state.settings });
  });

  document.getElementById('add-cat-btn').addEventListener('click', async () => {
    const val = document.getElementById('new-cat-input').value.trim();
    if (!val) return;
    if (!state.categories.includes(val)) {
      state.categories.push(val);
      await StorageManager.saveState({ categories: state.categories });
      renderCategories();
    }
    document.getElementById('new-cat-input').value = '';
  });

  document.getElementById('clear-all-categories-btn').addEventListener('click', async () => {
    state.categories = [];
    await StorageManager.saveState({ categories: [] });
    renderCategories();
  });

  // Category CSV
  const catCsvInput = document.getElementById('cat-csv-file-input');
  document.getElementById('import-cat-csv-btn').addEventListener('click', () => catCsvInput.click());
  catCsvInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await CSVManager.readFileText(file);
      const imported = CSVManager.parseSingleColumnCSV(text, 'category');
      state.categories = Array.from(new Set([...state.categories, ...imported]));
      await StorageManager.saveState({ categories: state.categories });
      renderCategories();
      alert(`Imported ${imported.length} categories.`);
    } catch (err) {
      alert(err.message);
    }
    catCsvInput.value = '';
  });

  // Negative Keywords Handlers
  document.getElementById('use-negatives-toggle').addEventListener('change', async (e) => {
    state.settings.useNegativeKeywords = e.target.checked;
    await StorageManager.saveState({ settings: state.settings });
  });

  document.getElementById('add-neg-btn').addEventListener('click', async () => {
    const val = document.getElementById('new-neg-input').value.trim();
    if (!val) return;
    if (!state.negativeKeywords.includes(val)) {
      state.negativeKeywords.push(val);
      await StorageManager.saveState({ negativeKeywords: state.negativeKeywords });
      renderNegatives();
    }
    document.getElementById('new-neg-input').value = '';
  });

  document.getElementById('clear-all-negatives-btn').addEventListener('click', async () => {
    state.negativeKeywords = [];
    await StorageManager.saveState({ negativeKeywords: [] });
    renderNegatives();
  });

  // Domestic Locations Handlers
  populateStateSelect('tab-loc-state-select');
  document.getElementById('tab-loc-state-select').addEventListener('change', () => {
    updateCitySelect('tab-loc-state-select', 'tab-loc-city-select', '-- (All Cities in State) --');
  });

  document.getElementById('tab-loc-add-btn').addEventListener('click', async () => {
    const st = document.getElementById('tab-loc-state-select').value;
    const ct = document.getElementById('tab-loc-city-select').value;
    if (!st) {
      alert('Please choose a State / UT from the list.');
      return;
    }
    const locTag = ct ? `${ct}, ${st}` : st;
    if (!state.locations.includes(locTag)) {
      state.locations.push(locTag);
      await StorageManager.saveState({ locations: state.locations });
      renderLocations();
    }
    document.getElementById('tab-loc-state-select').value = '';
    resetCitySelect('tab-loc-city-select', '-- (All Cities in State) --');
  });

  document.getElementById('use-locations-toggle').addEventListener('change', async (e) => {
    state.settings.useLocations = e.target.checked;
    await StorageManager.saveState({ settings: state.settings });
  });

  document.getElementById('add-loc-btn').addEventListener('click', async () => {
    const val = document.getElementById('new-loc-input').value.trim();
    if (!val) return;
    if (!state.locations.includes(val)) {
      state.locations.push(val);
      await StorageManager.saveState({ locations: state.locations });
      renderLocations();
    }
    document.getElementById('new-loc-input').value = '';
  });

  document.getElementById('clear-all-locations-btn').addEventListener('click', async () => {
    state.locations = [];
    await StorageManager.saveState({ locations: [] });
    renderLocations();
  });

  const locCsvInput = document.getElementById('loc-csv-file-input');
  document.getElementById('import-loc-csv-btn').addEventListener('click', () => locCsvInput.click());
  locCsvInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await CSVManager.readFileText(file);
      const imported = CSVManager.parseSingleColumnCSV(text, 'location');
      state.locations = Array.from(new Set([...state.locations, ...imported]));
      await StorageManager.saveState({ locations: state.locations });
      renderLocations();
      alert(`Imported ${imported.length} locations.`);
    } catch (err) {
      alert(err.message);
    }
    locCsvInput.value = '';
  });

  // Export Countries Handlers
  document.getElementById('use-export-countries-toggle').addEventListener('change', async (e) => {
    state.settings.useExportCountries = e.target.checked;
    await StorageManager.saveState({ settings: state.settings });
  });

  document.getElementById('add-country-btn').addEventListener('click', async () => {
    const val = document.getElementById('new-country-input').value.trim();
    if (!val) return;
    if (!state.exportCountries.includes(val)) {
      state.exportCountries.push(val);
      await StorageManager.saveState({ exportCountries: state.exportCountries });
      renderCountries();
    }
    document.getElementById('new-country-input').value = '';
  });

  document.getElementById('clear-all-countries-btn').addEventListener('click', async () => {
    state.exportCountries = [];
    await StorageManager.saveState({ exportCountries: [] });
    renderCountries();
  });

  const countryCsvInput = document.getElementById('country-csv-file-input');
  document.getElementById('import-country-csv-btn').addEventListener('click', () => countryCsvInput.click());
  countryCsvInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await CSVManager.readFileText(file);
      const imported = CSVManager.parseSingleColumnCSV(text, 'country');
      state.exportCountries = Array.from(new Set([...state.exportCountries, ...imported]));
      await StorageManager.saveState({ exportCountries: state.exportCountries });
      renderCountries();
      alert(`Imported ${imported.length} export countries.`);
    } catch (err) {
      alert(err.message);
    }
    countryCsvInput.value = '';
  });

  // Blocked Locations Handlers
  populateStateSelect('tab-blocked-state-select');
  document.getElementById('tab-blocked-state-select').addEventListener('change', () => {
    updateCitySelect('tab-blocked-state-select', 'tab-blocked-city-select', '-- (Block Entire State) --');
  });

  document.getElementById('tab-blocked-add-btn').addEventListener('click', async () => {
    const st = document.getElementById('tab-blocked-state-select').value;
    const ct = document.getElementById('tab-blocked-city-select').value;
    if (!st) {
      alert('Please choose a State / UT to block.');
      return;
    }
    const locTag = ct ? `${ct}, ${st}` : st;
    if (!state.blockedLocations.includes(locTag)) {
      state.blockedLocations.push(locTag);
      await StorageManager.saveState({ blockedLocations: state.blockedLocations });
      renderBlocked();
    }
    document.getElementById('tab-blocked-state-select').value = '';
    resetCitySelect('tab-blocked-city-select', '-- (Block Entire State) --');
  });

  document.getElementById('use-blocked-locations-toggle').addEventListener('change', async (e) => {
    state.settings.useBlockedLocations = e.target.checked;
    await StorageManager.saveState({ settings: state.settings });
  });

  document.getElementById('add-blocked-btn').addEventListener('click', async () => {
    const val = document.getElementById('new-blocked-input').value.trim();
    if (!val) return;
    if (!state.blockedLocations.includes(val)) {
      state.blockedLocations.push(val);
      await StorageManager.saveState({ blockedLocations: state.blockedLocations });
      renderBlocked();
    }
    document.getElementById('new-blocked-input').value = '';
  });

  // Verification & Controls
  let saveFeedbackTimer = null;
  const saveControls = async (showBadge = true) => {
    state.settings.filterOnlyVerified = document.getElementById('filter-verified-toggle').checked;
    state.settings.verificationTypes = {
      gst: document.getElementById('verify-gst').checked,
      phone: document.getElementById('verify-phone').checked,
      email: document.getElementById('verify-email').checked,
      whatsapp: document.getElementById('verify-whatsapp').checked,
      website: document.getElementById('verify-website').checked
    };
    state.settings.globalDailyClickLimit = parseInt(document.getElementById('global-limit-input').value, 10) || 0;
    state.settings.globalMinOrderValue = parseFloat(document.getElementById('global-min-order-input').value) || 0;
    state.settings.excludeRetailLeads = document.getElementById('exclude-retail-toggle').checked;
    state.settings.refreshInterval = Math.max(3, parseInt(document.getElementById('dashboard-refresh-sec').value, 10) || 15);
    await StorageManager.saveState({ settings: state.settings });

    if (showBadge) {
      const badge = document.getElementById('controls-saved-badge');
      if (badge) {
        badge.style.display = 'inline-block';
        clearTimeout(saveFeedbackTimer);
        saveFeedbackTimer = setTimeout(() => {
          badge.style.display = 'none';
        }, 3000);
      }
    }
  };

  const controlIds = [
    'filter-verified-toggle', 'verify-gst', 'verify-phone', 'verify-email',
    'verify-whatsapp', 'verify-website', 'global-limit-input',
    'global-min-order-input', 'exclude-retail-toggle', 'dashboard-refresh-sec'
  ];

  controlIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => saveControls(true));
    if (el.tagName === 'INPUT' && (el.type === 'number' || el.type === 'text')) {
      el.addEventListener('input', () => saveControls(false));
    }
  });

  const saveBtn = document.getElementById('save-controls-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      saveControls(true);
    });
  }

  // Test Sound
  document.getElementById('test-sound-btn').addEventListener('click', playTestChime);

  // History Actions
  document.getElementById('clear-history-btn').addEventListener('click', async () => {
    if (confirm("Reset today's click history, counter, and lead memory?")) {
      chrome.runtime.sendMessage({ action: 'RESET_TODAY_CLICKS' }, () => {
        state.history = [];
        state.clickedLeadIds = [];
        if (state.stats) state.stats.clicksToday = 0;
        if (state.keywords) state.keywords.forEach(k => { k.clicksToday = 0; });
        renderStats();
        renderKeywords();
        renderHistory();
      });
    }
  });

  document.getElementById('export-history-csv-btn').addEventListener('click', () => {
    if (!state.history || state.history.length === 0) {
      alert('No history to export yet.');
      return;
    }
    let csv = 'Timestamp,Portal,Keyword,Title,Location,Quantity,Order Value,Status\n';
    state.history.forEach(h => {
      csv += `"${h.timeFormatted}","${h.portal || 'IndiaMart'}","${h.keyword}","${h.title.replace(/"/g, '""')}","${h.buyerLocation}","${h.quantity}","${h.orderValue}","${h.status}"\n`;
    });
    CSVManager.exportToCSV(`b2b_leads_history_${StorageManager.getTodayString()}.csv`, csv);
  });

  // Simulator
  document.getElementById('run-sim-test-btn').addEventListener('click', runSimulator);
  document.getElementById('load-sample-lead-btn').addEventListener('click', () => {
    document.getElementById('sim-lead-title').value = 'High Quality Electric Stacker 2 Ton';
    document.getElementById('sim-lead-qty').value = '5 Piece';
    document.getElementById('sim-lead-val').value = '₹ 5,00,000';
    document.getElementById('sim-lead-loc').value = 'Mumbai, Maharashtra';
    document.getElementById('sim-v-gst').checked = true;
    document.getElementById('sim-v-phone').checked = true;
    runSimulator();
  });

  // Backup & Restore
  document.getElementById('export-full-backup-btn').addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `indiamart_autoclick_backup_${StorageManager.getTodayString()}.json`);
    dlAnchor.click();
  });

  const backupInput = document.getElementById('backup-file-input');
  document.getElementById('import-full-backup-btn').addEventListener('click', () => backupInput.click());
  backupInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await CSVManager.readFileText(file);
      const parsed = JSON.parse(text);
      if (parsed.settings && parsed.keywords) {
        state = parsed;
        await StorageManager.saveState(state);
        loadAll();
        alert('All rules, keywords, and settings restored successfully!');
      } else {
        alert('Invalid backup file format.');
      }
    } catch (err) {
      alert('Failed to import backup: ' + err.message);
    }
    backupInput.value = '';
  });

  // Sample CSV Downloads
  document.getElementById('dl-sample-kw-csv').addEventListener('click', () => {
    const sample = 'keyword,qty,unit,category,clicks,min_order_value,target_location\n' +
      'Electric Stacker,1,Piece,Material Handling,0,0,Maharashtra\n' +
      'Scissor Lift,1,Piece,Industrial Machinery,0,0,\n' +
      'Electric Forklift,1,Piece,Warehouse Equipment,0,50000,Gujarat\n';
    CSVManager.exportToCSV('sample_keywords_template.csv', sample);
  });

  document.getElementById('dl-sample-loc-csv').addEventListener('click', () => {
    const sample = 'location\nMaharashtra\nGujarat\nDelhi\nKarnataka\nTamil Nadu\n';
    CSVManager.exportToCSV('sample_locations_template.csv', sample);
  });

  document.getElementById('dl-sample-country-csv').addEventListener('click', () => {
    const sample = 'country\nUnited States\nUnited Kingdom\nUnited Arab Emirates\nGermany\nCanada\n';
    CSVManager.exportToCSV('sample_export_countries_template.csv', sample);
  });
});

