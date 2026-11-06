/**
 * IndiaMart Lead Autoclick Pro - Storage & State Management
 * Production presets for Aguatech Engineers Pvt. Ltd.
 */

const DEFAULT_SETTINGS = {
  engineActive: true,
  soundEnabled: true,
  autoRefreshEnabled: true,
  refreshInterval: 40, // seconds
  showOnScreenTimer: true,
  globalDailyClickLimit: 10,
  globalMinOrderValue: 0,
  excludeRetailLeads: false,
  filterOnlyVerified: false,
  verificationTypes: {
    email: false,
    gst: false,
    phone: true,
    website: false,
    whatsapp: false
  },
  useNegativeKeywords: true,
  useLocations: true,
  useBlockedLocations: true,
  useExportCountries: false,
  useCategories: false,
  keywordSorting: 'entry',
  categorySorting: 'entry',
  locationSorting: 'entry'
};

const DEFAULT_KEYWORDS = [
  {
    id: "kw-1",
    keyword: "Electric Stacker",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "",
    targetScope: "global",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-2",
    keyword: "Scissor lift",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "All India",
    targetScope: "all",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-5",
    keyword: "Goods Lift",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "Maharashtra, Gujarat, Karnataka, Goa, Madhya Pradesh, Jharkhand, Dadra and Nagar Haveli and Daman and Diu, Andhra Pradesh, Rajasthan, West Bengal",
    targetScope: "custom",
    targetStates: [
      "Maharashtra",
      "Gujarat",
      "Karnataka",
      "Goa",
      "Madhya Pradesh",
      "Jharkhand",
      "Dadra and Nagar Haveli and Daman and Diu",
      "Andhra Pradesh",
      "Rajasthan",
      "West Bengal"
    ],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793601068424",
    keyword: "Arial work Platform",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "",
    targetScope: "global",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793601145060",
    keyword: "Electric Reach stacker",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "",
    targetScope: "global",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793601223405",
    keyword: "Mobile hydraulic Dock Ramp",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "All India",
    targetScope: "all",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793601250227",
    keyword: "Jib Crane",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "",
    targetScope: "global",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793601271347",
    keyword: "Hand Pallet Truck",
    minQty: 10,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "",
    targetScope: "global",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793601301251",
    keyword: "Battery Operated Pallet Truck",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "",
    targetScope: "global",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793601366315",
    keyword: "Hydraulic Manual Stacker",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "",
    targetScope: "global",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793601403599",
    keyword: "Semi Electric Stacker",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "",
    targetScope: "global",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793601421872",
    keyword: "High Lift Pallet Truck",
    minQty: 2,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "",
    targetScope: "global",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793601493317",
    keyword: "Electrical Scissor Lift",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "",
    targetScope: "global",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793601533704",
    keyword: "Industrial Dock Leveler",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "All India",
    targetScope: "all",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793601602815",
    keyword: "Hydraulic Dock Leveler",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "",
    targetScope: "global",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793601955304",
    keyword: "Hydraulic Jib Crane",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "",
    targetScope: "global",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793680199477",
    keyword: "Hydraulic Dock Ramp",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "All India",
    targetScope: "all",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793680216158",
    keyword: "Self Propelled Scissor lift",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "All India",
    targetScope: "all",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  },
  {
    id: "kw-1793680224857",
    keyword: "Boom Lift",
    minQty: 1,
    unit: "Piece",
    category: "",
    dailyLimit: 0,
    minOrderValue: 0,
    targetLocation: "",
    targetScope: "global",
    targetStates: [],
    targetCities: [],
    clicksToday: 0
  }
];

const DEFAULT_NEGATIVE_KEYWORDS = [
  "Rental",
  "Old",
  "Service",
  "Kit",
  "Second Hand",
  "Scrap",
  "Repair",
  "Godrej",
  "Forklift Services",
  "Diesel",
  "Voltas Diesel",
  "Gallop Pallet",
  "Double Wheel Barrow",
  "Rough Terrain"
];

const DEFAULT_LOCATIONS = [
  "Maharashtra",
  "Gujarat",
  "Madhya Pradesh",
  "Karnataka",
  "Hyderabad",
  "Goa"
];

const DEFAULT_BLOCKED_LOCATIONS = [
  "Delhi",
  "Bihar",
  "Assam",
  "North India",
  "Noida",
  "J & K"
];

export class StorageManager {
  static getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  static async getState() {
    return new Promise((resolve) => {
      chrome.storage.local.get([
        'settings',
        'keywords',
        'categories',
        'negativeKeywords',
        'locations',
        'blockedLocations',
        'exportCountries',
        'productCountryRules',
        'productLocationRules',
        'stats',
        'history',
        'clickedLeadIds'
      ], (res) => {
        const today = StorageManager.getTodayString();
        let stats = res.stats || { clicksToday: 0, totalClicks: 0, lastResetDate: today };
        let keywords = (res.keywords && res.keywords.length > 0) ? res.keywords : DEFAULT_KEYWORDS;
        let history = res.history || [];
        let clickedLeadIds = res.clickedLeadIds || [];

        // Midnight reset check: rollover daily click counters and reset clicked lead memory for the new day
        if (stats.lastResetDate !== today) {
          stats.clicksToday = 0;
          stats.lastResetDate = today;
          keywords = keywords.map(k => ({ ...k, clicksToday: 0 }));
          // Clear previous days' lock so matching leads can be processed today
          clickedLeadIds = [];
          history = [];
          chrome.storage.local.set({ stats, keywords, history, clickedLeadIds });
        }

        resolve({
          settings: { ...DEFAULT_SETTINGS, ...(res.settings || {}) },
          keywords,
          categories: res.categories || [],
          negativeKeywords: (res.negativeKeywords && res.negativeKeywords.length > 0) ? res.negativeKeywords : DEFAULT_NEGATIVE_KEYWORDS,
          locations: (res.locations && res.locations.length > 0) ? res.locations : DEFAULT_LOCATIONS,
          blockedLocations: (res.blockedLocations && res.blockedLocations.length > 0) ? res.blockedLocations : DEFAULT_BLOCKED_LOCATIONS,
          exportCountries: res.exportCountries || [],
          productCountryRules: res.productCountryRules || [],
          productLocationRules: res.productLocationRules || [],
          stats,
          history,
          clickedLeadIds: res.clickedLeadIds || []
        });
      });
    });
  }

  static async saveState(partialState) {
    return new Promise((resolve) => {
      chrome.storage.local.set(partialState, () => {
        resolve(true);
      });
    });
  }

  static async recordClick(leadData) {
    const state = await StorageManager.getState();
    const today = StorageManager.getTodayString();

    state.stats.clicksToday += 1;
    state.stats.totalClicks = (state.stats.totalClicks || 0) + 1;
    state.stats.lastResetDate = today;

    if (leadData.keyword) {
      const kw = state.keywords.find(k => k.keyword.toLowerCase() === leadData.keyword.toLowerCase());
      if (kw) {
        kw.clicksToday = (kw.clicksToday || 0) + 1;
      }
    }

    const historyItem = {
      id: 'click-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString(),
      portal: leadData.portal || 'IndiaMart',
      title: leadData.title || 'BuyLead Requirement',
      buyerLocation: leadData.location || 'India',
      keyword: leadData.keyword || 'General',
      quantity: leadData.quantity || 'N/A',
      orderValue: leadData.orderValue || 'N/A',
      status: 'CLICKED'
    };

    const updatedHistory = [historyItem, ...(state.history || [])].slice(0, 200);
    const toAdd = [leadData.leadId, leadData.titleKey].filter(Boolean);
    const updatedClickedIds = [...(state.clickedLeadIds || []), ...toAdd].slice(-500);

    await StorageManager.saveState({
      stats: state.stats,
      keywords: state.keywords,
      history: updatedHistory,
      clickedLeadIds: updatedClickedIds
    });

    return { stats: state.stats, historyItem };
  }
}
