/**
 * IndiaMart Lead Autoclick Pro - Rule Matching Engine
 * Evaluates BuyLead data against all user-configured rules and filters
 */

class LeadMatcher {
  /**
   * Main evaluation method: returns { match: boolean, matchedKeyword: object|null, reason: string }
   */
  static evaluate(lead, config) {
    const { settings, keywords, categories, negativeKeywords, locations, blockedLocations, exportCountries, productCountryRules, productLocationRules, stats } = config;

    // 1. Check Global Daily Limit
    if (settings.globalDailyClickLimit > 0 && stats.clicksToday >= settings.globalDailyClickLimit) {
      return { match: false, reason: `Global daily click limit (${settings.globalDailyClickLimit}) reached.` };
    }

    // 2. Skip pure recommendation banners without actionable buttons
    if (lead.isRecommendation && !lead.button) {
      return { match: false, reason: 'Excluded: Recommendation banner (no contact button).' };
    }

    // 3. Exclude Retail Leads
    if (settings.excludeRetailLeads && lead.isRetail) {
      return { match: false, reason: 'Excluded: Retail / personal use inquiry.' };
    }

    // 4. Global Minimum Order Value
    if (settings.globalMinOrderValue > 0 && lead.orderValue > 0 && lead.orderValue < settings.globalMinOrderValue) {
      return { match: false, reason: `Order value (₹${lead.orderValue.toLocaleString('en-IN')}) below global minimum (₹${settings.globalMinOrderValue.toLocaleString('en-IN')}).` };
    }

    // 5. Verification Filters
    if (settings.filterOnlyVerified) {
      const vTypes = settings.verificationTypes || {};
      const requiredActive = Object.values(vTypes).some(Boolean);

      if (requiredActive) {
        let hasAnyRequired = false;
        if (vTypes.gst && lead.verifications.gst) hasAnyRequired = true;
        if (vTypes.phone && lead.verifications.phone) hasAnyRequired = true;
        if (vTypes.email && lead.verifications.email) hasAnyRequired = true;
        if (vTypes.whatsapp && lead.verifications.whatsapp) hasAnyRequired = true;
        if (vTypes.website && lead.verifications.website) hasAnyRequired = true;

        if (!hasAnyRequired) {
          const reqs = Object.keys(vTypes).filter(k => vTypes[k]).join(', ');
          return { match: false, reason: `Does not meet required verification (${reqs}).` };
        }
      }
    }

    // 6. Negative Keywords Filtering
    if (settings.useNegativeKeywords && negativeKeywords && negativeKeywords.length > 0) {
      const leadText = (lead.title + ' ' + lead.rawText).toLowerCase();
      for (const neg of negativeKeywords) {
        const cleanNeg = neg.trim().toLowerCase();
        if (cleanNeg && this.textContainsWord(leadText, cleanNeg)) {
          return { match: false, reason: `Matched negative keyword "${neg}".` };
        }
      }
    }

    // 7. Blocked Locations Filtering (Blacklist applies universally)
    if (settings.useBlockedLocations && blockedLocations && blockedLocations.length > 0) {
      const locText = lead.location.toLowerCase();
      for (const bl of blockedLocations) {
        const cleanBl = bl.trim().toLowerCase();
        if (!cleanBl) continue;
        if (locText.includes(cleanBl)) {
          return { match: false, reason: `Location matched blocked location "${bl}".` };
        }
        // If cleanBl is a state name in IndiaLocationsManager, also check all cities belonging to it
        if (typeof IndiaLocationsManager !== 'undefined') {
          const stateCities = IndiaLocationsManager.getCitiesForState(cleanBl);
          if (stateCities.some(c => locText.includes(c.toLowerCase()))) {
            return { match: false, reason: `Location matched city in blocked state "${bl}".` };
          }
        }
      }
    }

    // 8. Keyword / Category Matching with Per-Keyword Location Intelligence
    let matchedKw = null;
    let matchedReason = '';
    let locationSkipReason = '';

    // Check keywords in both Title and Card Body Text
    if (keywords && keywords.length > 0) {
      for (const kwItem of keywords) {
        if (!kwItem.keyword || !kwItem.keyword.trim()) continue;

        const kwStr = kwItem.keyword.trim();
        const matchesTitle = this.matchesKeyword(lead.title, kwStr);
        const matchesBody = this.matchesKeyword(lead.rawText, kwStr);

        if (matchesTitle || matchesBody) {
          // Check per-keyword daily click limit
          if (kwItem.dailyLimit > 0 && (kwItem.clicksToday || 0) >= kwItem.dailyLimit) {
            continue; // Limit reached for this keyword
          }

          // Check per-keyword minimum buyer quantity
          if (!lead.isUnspecified && kwItem.minQty > 1 && lead.quantity < kwItem.minQty) {
            continue; // Specified quantity is less than requirement
          }

          // Check per-keyword unit if specified (allow generic 'Piece' for all industrial equipment)
          if (kwItem.unit && lead.unit && kwItem.unit.toLowerCase() !== 'piece' && !lead.isUnspecified) {
            if (!this.unitsCompatible(kwItem.unit, lead.unit)) {
              continue; // Unit mismatch
            }
          }

          // Check per-keyword minimum order value
          if (kwItem.minOrderValue > 0 && lead.orderValue > 0 && lead.orderValue < kwItem.minOrderValue) {
            continue;
          }

          // Check Location & Export Country Target for this specific Keyword
          const locationEval = this.evaluateKeywordLocation(lead, kwItem, settings, locations, exportCountries, productCountryRules, productLocationRules);
          if (!locationEval.allowed) {
            locationSkipReason = locationEval.reason;
            continue;
          }

          matchedKw = kwItem;
          matchedReason = `Matched keyword "${kwItem.keyword}" (${locationEval.reason || 'Location verified'})`;
          break;
        }
      }
    }

    // Category matching (if enabled)
    if (!matchedKw && settings.useCategories && categories && categories.length > 0) {
      const fullText = (lead.title + ' ' + lead.rawText).toLowerCase();
      for (const cat of categories) {
        if (cat && fullText.includes(cat.trim().toLowerCase())) {
          // Validate against global location filter for categories
          const globalLocEval = this.checkLocations(lead, settings, locations, exportCountries);
          if (globalLocEval.allowed) {
            matchedKw = { keyword: `[Category: ${cat}]`, id: 'cat-' + cat };
            matchedReason = `Matched category "${cat}"`;
            break;
          } else {
            locationSkipReason = globalLocEval.reason;
          }
        }
      }
    }

    if (!matchedKw) {
      if (locationSkipReason) {
        return {
          match: false,
          reason: locationSkipReason
        };
      }
      const activeKwSample = (keywords || []).slice(0, 3).map(k => k.keyword).join(', ');
      return {
        match: false,
        reason: `No keywords matched. Active: [${activeKwSample}${keywords.length > 3 ? '...' : ''}]. Lead title: "${lead.title.slice(0, 50)}"`
      };
    }

    return {
      match: true,
      matchedKeyword: matchedKw,
      reason: matchedReason
    };
  }

  /**
   * Evaluates location rules for a specific keyword:
   * 1. Per-keyword Target Location (allows "All India" or multi-state override)
   * 2. Specific Product-Location rules
   * 3. Fallback to Global Domestic Locations
   */
  static evaluateKeywordLocation(lead, kwItem, settings, locations, exportCountries, productCountryRules, productLocationRules) {
    const leadLocLower = (lead.location || '').toLowerCase();
    const leadCountryLower = (lead.country || 'india').toLowerCase();

    // 1. Export lead evaluation
    if (lead.isExport) {
      // Check Product-Country specification first
      if (productCountryRules && productCountryRules.length > 0) {
        const pRule = productCountryRules.find(r => r.keyword.toLowerCase() === kwItem.keyword.toLowerCase());
        if (pRule && pRule.country) {
          const matchCountry = leadCountryLower.includes(pRule.country.toLowerCase());
          return matchCountry
            ? { allowed: true, reason: `Matched product-country rule: ${pRule.country}` }
            : { allowed: false, reason: `Country "${lead.country}" does not match rule for ${kwItem.keyword} (${pRule.country}).` };
        }
      }

      // If global export targeting is enabled
      if (settings.useExportCountries && exportCountries && exportCountries.length > 0) {
        const matchExport = exportCountries.some(c => leadCountryLower.includes(c.trim().toLowerCase()));
        return matchExport
          ? { allowed: true, reason: `Matched target export country` }
          : { allowed: false, reason: `Export country "${lead.country}" not in target list.` };
      }

      // If domestic only filter is ON and no export rule, exclude export
      if (settings.useLocations && locations && locations.length > 0) {
        return { allowed: false, reason: 'Domestic location filter is active; international lead excluded.' };
      }

      return { allowed: true, reason: 'Export lead allowed' };
    }

    // 2. Domestic lead evaluation

    // A. Check Structured / Per-Keyword Target Location Override
    const scope = (kwItem.targetScope || '').toLowerCase();
    if (scope === 'all' || scope === 'all_india') {
      return { allowed: true, reason: 'Wider Domestic Pickup (All India)' };
    }

    const hasStates = Array.isArray(kwItem.targetStates) && kwItem.targetStates.length > 0;
    const hasCities = Array.isArray(kwItem.targetCities) && kwItem.targetCities.length > 0;
    const hasRawLoc = kwItem.targetLocation && kwItem.targetLocation.trim();

    if (hasStates || hasCities || hasRawLoc) {
      const rawTarget = (kwItem.targetLocation || '').trim().toLowerCase();

      // Explicit All India check
      if (rawTarget === 'all' || rawTarget === 'all india' || rawTarget === 'pan india' || rawTarget === 'india' || rawTarget === 'any') {
        return { allowed: true, reason: 'Wider Domestic Pickup (All India)' };
      }

      // If structured targetStates or targetCities are defined, use IndiaLocationsManager
      if (hasStates || hasCities) {
        if (typeof IndiaLocationsManager !== 'undefined') {
          const matchResult = IndiaLocationsManager.matchesLocationCriteria(lead.location, kwItem.targetStates || [], kwItem.targetCities || []);
          if (matchResult && matchResult.matched) {
            return { allowed: true, reason: `Matched target location: ${matchResult.value || kwItem.targetLocation}` };
          } else {
            const stateSummary = (kwItem.targetStates || []).join(', ');
            const citySummary = hasCities ? ` (Cities: ${kwItem.targetCities.join(', ')})` : ' (All Cities)';
            return { allowed: false, reason: `Location "${lead.location}" does not match target: ${stateSummary}${citySummary}` };
          }
        }
      }

      // Fallback or comma-separated string evaluation (e.g. "Maharashtra, Gujarat")
      if (hasRawLoc) {
        const targets = rawTarget.split(',').map(t => t.trim()).filter(Boolean);
        const isTargetMatched = targets.some(target => {
          if (target === 'all' || target === 'all india' || target === 'pan india') return true;
          if (leadLocLower.includes(target)) return true;
          // If target is a state name, check all its known cities as well
          if (typeof IndiaLocationsManager !== 'undefined') {
            const cities = IndiaLocationsManager.getCitiesForState(target);
            if (cities.some(c => leadLocLower.includes(c.toLowerCase()))) return true;
          }
          return false;
        });

        if (isTargetMatched) {
          return { allowed: true, reason: `Matched keyword target location: ${kwItem.targetLocation}` };
        } else {
          return { allowed: false, reason: `Location "${lead.location}" does not match keyword target (${kwItem.targetLocation}).` };
        }
      }
    }

    // B. Check Product-Location Specific Rules (if any)
    if (productLocationRules && productLocationRules.length > 0) {
      const pLocRule = productLocationRules.find(r => r.keyword.toLowerCase() === kwItem.keyword.toLowerCase());
      if (pLocRule && pLocRule.location) {
        const ruleLoc = pLocRule.location.trim().toLowerCase();
        if (ruleLoc === 'all' || ruleLoc === 'all india' || leadLocLower.includes(ruleLoc)) {
          return { allowed: true, reason: `Matched product-location rule: ${pLocRule.location}` };
        } else {
          return { allowed: false, reason: `Location "${lead.location}" does not match product rule (${pLocRule.location}).` };
        }
      }
    }

    // C. Fallback: Check Global Domestic Locations Filter
    if (settings.useLocations && locations && locations.length > 0) {
      const matchGlobal = locations.some(loc => {
        const cleanLoc = loc.trim().toLowerCase();
        if (!cleanLoc) return false;
        if (leadLocLower.includes(cleanLoc)) return true;
        // If cleanLoc has an alias (e.g. gujrat -> gujarat, hydrabad -> hyderabad)
        if (typeof IndiaLocationsManager !== 'undefined') {
          const canonical = IndiaLocationsManager.normalizeName(cleanLoc).toLowerCase();
          if (leadLocLower.includes(canonical)) return true;
          const cities = IndiaLocationsManager.getCitiesForState(cleanLoc);
          if (cities.some(c => leadLocLower.includes(c.toLowerCase()))) return true;
        }
        return false;
      });

      if (matchGlobal) {
        return { allowed: true, reason: 'Matched global domestic location' };
      } else {
        return { allowed: false, reason: `Location "${lead.location}" not in domestic target locations.` };
      }
    }

    // Both location filters disabled -> Open pickup across India
    return { allowed: true, reason: 'All India location allowed' };
  }

  static checkLocations(lead, settings, locations, exportCountries) {
    const locOn = settings.useLocations && locations && locations.length > 0;
    const expOn = settings.useExportCountries && exportCountries && exportCountries.length > 0;

    // Both OFF: location filtering disabled (all India & export allowed)
    if (!locOn && !expOn) {
      return { allowed: true };
    }

    // Normal Location ON, Export OFF: Only normal domestic locations checked
    if (locOn && !expOn) {
      if (lead.isExport) {
        return { allowed: false, reason: 'Domestic location filter ON, export leads excluded.' };
      }
      const match = locations.some(loc => {
        const cleanLoc = loc.trim().toLowerCase();
        if (!cleanLoc) return false;
        if (lead.location.toLowerCase().includes(cleanLoc)) return true;
        if (typeof IndiaLocationsManager !== 'undefined') {
          const canonical = IndiaLocationsManager.normalizeName(cleanLoc).toLowerCase();
          if (lead.location.toLowerCase().includes(canonical)) return true;
          const cities = IndiaLocationsManager.getCitiesForState(cleanLoc);
          if (cities.some(c => lead.location.toLowerCase().includes(c.toLowerCase()))) return true;
        }
        return false;
      });
      return match ? { allowed: true } : { allowed: false, reason: `Location "${lead.location}" not in target locations.` };
    }

    // Normal Location OFF, Export ON: Only export countries checked
    if (!locOn && expOn) {
      if (!lead.isExport) {
        return { allowed: false, reason: 'Export country targeting ON, domestic leads excluded.' };
      }
      const match = exportCountries.some(ctry => lead.country.toLowerCase().includes(ctry.trim().toLowerCase()));
      return match ? { allowed: true } : { allowed: false, reason: `Country "${lead.country}" not in export targets.` };
    }

    // Both filters ON:
    if (lead.isExport) {
      const match = exportCountries.some(ctry => lead.country.toLowerCase().includes(ctry.trim().toLowerCase()));
      return match ? { allowed: true } : { allowed: false, reason: `Export country "${lead.country}" not in export targets.` };
    } else {
      const match = locations.some(loc => lead.location.toLowerCase().includes(loc.trim().toLowerCase()));
      return match ? { allowed: true } : { allowed: false, reason: `Location "${lead.location}" not in target locations.` };
    }
  }

  /**
   * Check if text matches keyword with singular/plural and word token awareness
   */
  static matchesKeyword(text, keyword) {
    if (!text || !keyword) return false;
    const cleanText = text.toLowerCase().replace(/hydrualic/g, 'hydraulic');
    const cleanKw = keyword.trim().toLowerCase().replace(/hydrualic/g, 'hydraulic');

    // 1. Direct or substring match
    if (cleanText.includes(cleanKw)) return true;

    // 2. Plural / singular variants
    let pluralVariant = cleanKw + 's';
    if (cleanKw.endsWith('s') || cleanKw.endsWith('x') || cleanKw.endsWith('ch') || cleanKw.endsWith('sh')) {
      pluralVariant = cleanKw + 'es';
    }
    if (cleanText.includes(pluralVariant)) return true;

    if (cleanKw.endsWith('s') && cleanKw.length > 3) {
      const singularVariant = cleanKw.slice(0, -1);
      if (cleanText.includes(singularVariant)) return true;
    }

    // 3. Multi-word token match (e.g. "Electric Stacker" matches "Stacker - Semi Electric")
    const words = cleanKw.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 1) {
      const allWordsPresent = words.every(w => {
        return cleanText.includes(w) || cleanText.includes(w + 's');
      });
      if (allWordsPresent) return true;
    }

    // 4. Pharma support: strip / stripe
    if (cleanKw.includes('strip') && cleanText.includes('stripe')) return true;
    if (cleanKw.includes('stripe') && cleanText.includes('strip')) return true;

    return false;
  }

  static textContainsWord(text, word) {
    const escaped = word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i');
    return regex.test(text);
  }

  static unitsCompatible(targetUnit, leadUnit) {
    if (!targetUnit || !leadUnit) return true;
    const t = targetUnit.toLowerCase().trim();
    const l = leadUnit.toLowerCase().trim();

    if (t === l) return true;

    const aliases = {
      'piece': ['pcs', 'pc', 'piece', 'pieces', 'unit', 'units', 'nos', 'no', 'number', 'numbers'],
      'kg': ['kg', 'kgs', 'kilogram', 'kilograms'],
      'box': ['box', 'boxes', 'carton', 'cartons', 'pack', 'packs'],
      'meter': ['meter', 'meters', 'mtr', 'mtrs', 'm'],
      'ton': ['ton', 'tons', 'tonne', 'tonnes'],
      'strip': ['strip', 'strips', 'stripe', 'stripes'],
      'set': ['set', 'sets', 'kit', 'kits'],
      'gram': ['gram', 'grams', 'gm', 'gms', 'g']
    };

    for (const group of Object.values(aliases)) {
      if (group.includes(t) && group.includes(l)) {
        return true;
      }
    }

    return false;
  }
}

if (typeof window !== 'undefined') {
  window.LeadMatcher = LeadMatcher;
}
