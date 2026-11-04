/**
 * IndiaMart Lead Autoclick Pro - India States & Cities Database & Helpers
 * Contains all 28 States and 8 Union Territories with major industrial,
 * commercial, and manufacturing hubs across India.
 */

(function (global) {
  'use strict';

  const INDIA_STATES_AND_CITIES = {
    "Andhra Pradesh": [
      "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati",
      "Kakinada", "Rajahmundry", "Kadapa", "Anantapur", "Chittoor", "Ongole",
      "Eluru", "Machilipatnam", "Srikakulam", "Vizianagaram", "Sri City"
    ],
    "Arunachal Pradesh": [
      "Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro"
    ],
    "Assam": [
      "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia",
      "Tezpur", "Bongaigaon", "Barpeta", "Dhubri"
    ],
    "Bihar": [
      "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga",
      "Bihar Sharif", "Arrah", "Begusarai", "Katihar", "Munger", "Chhapra",
      "Sasaram", "Hajipur", "Dehri", "Bettiah"
    ],
    "Chhattisgarh": [
      "Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon",
      "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari"
    ],
    "Goa": [
      "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim",
      "Curchorem", "Cuncolim", "Verna"
    ],
    "Gujarat": [
      "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar",
      "Gandhinagar", "Junagadh", "Anand", "Navsari", "Morbi", "Bharuch",
      "Vapi", "Ankleshwar", "Gandhidham", "Mehsana", "Valsad", "Porbandar",
      "Surendranagar", "Nadiad", "Godhra", "Palanpur", "Botad", "Veraval",
      "Sanand", "Dahej", "Halol", "Kadi", "Kalol", "Mundra", "Hazira", "Piramana", "Silvassa"
    ],
    "Haryana": [
      "Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak",
      "Hisar", "Karnal", "Sonipat", "Panchkula", "Manesar", "Bahadurgarh",
      "Rewari", "Jind", "Sirsa", "Bhiwani", "Palwal", "Kaithal", "Kurukshetra",
      "Bawal", "Dharuhera", "Kundli", "Murthal", "Samalkha"
    ],
    "Himachal Pradesh": [
      "Shimla", "Baddi", "Solan", "Dharamshala", "Mandi", "Kullu",
      "Paonta Sahib", "Una", "Nalagarh", "Kala Amb", "Mehatpur", "Parwanoo"
    ],
    "Jharkhand": [
      "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh",
      "Giridih", "Ramgarh", "Adityapur", "Chaibasa", "Dumka"
    ],
    "Karnataka": [
      "Bengaluru", "Mysuru", "Hubballi", "Belagavi", "Mangaluru", "Kalaburagi",
      "Davanagere", "Ballari", "Shivamogga", "Tumakuru", "Bidar", "Hosapete",
      "Udupi", "Hassan", "Peenya", "Bommasandra", "Whitefield", "Electronic City",
      "Dharwad", "Nelamangala", "Bidadi", "Doddaballapura"
    ],
    "Kerala": [
      "Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur", "Kannur",
      "Alappuzha", "Palakkad", "Malappuram", "Kottayam", "Ernakulam", "Kasaragod"
    ],
    "Madhya Pradesh": [
      "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas",
      "Satna", "Ratlam", "Rewa", "Pithampur", "Singrauli", "Burhanpur", "Katni",
      "Mandi Deep", "Khandwa", "Morena", "Bhind", "Chhindwara"
    ],
    "Maharashtra": [
      "Pune", "Mumbai", "Nagpur", "Thane", "Nashik", "Aurangabad",
      "Chhatrapati Sambhajinagar", "Solapur", "Kolhapur", "Navi Mumbai", "Amravati",
      "Nanded", "Sangli", "Jalgaon", "Akola", "Latur", "Dhule", "Ahmednagar",
      "Chandrapur", "Pimpri-Chinchwad", "Palghar", "Vasai-Virar", "Satara",
      "Ichalkaranji", "Raigad", "Jalna", "Wardha", "Bhiwandi", "Kalyan-Dombivli",
      "Mira-Bhayandar", "Panvel", "Boisar", "Tarapur", "Chakan", "Bhosari",
      "Talegaon", "Ranjangaon", "Baramati", "Shirwal", "Khed", "Waluj", "Shendra"
    ],
    "Manipur": [
      "Imphal", "Churachandpur", "Thoubal"
    ],
    "Meghalaya": [
      "Shillong", "Tura", "Jowai", "Byrnihat"
    ],
    "Mizoram": [
      "Aizawl", "Lunglei", "Champhai"
    ],
    "Nagaland": [
      "Kohima", "Dimapur", "Mokokchung"
    ],
    "Odisha": [
      "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri",
      "Balasore", "Bhadrak", "Angul", "Jharsuguda", "Paradeep", "Jajpur"
    ],
    "Punjab": [
      "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali",
      "SAS Nagar", "Hoshiarpur", "Batala", "Pathankot", "Moga", "Abohar",
      "Khanna", "Phagwara", "Mandi Gobindgarh", "Rajpura", "Dera Bassi"
    ],
    "Rajasthan": [
      "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara",
      "Alwar", "Sikar", "Sri Ganganagar", "Bhiwadi", "Pali", "Neemrana",
      "Chittorgarh", "Kishangarh", "Beawar", "Hanumangarh", "Sitapura", "VKIA"
    ],
    "Sikkim": [
      "Gangtok", "Namchi", "Geyzing", "Rangpo"
    ],
    "Tamil Nadu": [
      "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur",
      "Erode", "Tirunelveli", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur",
      "Ranipet", "Hosur", "Kanchipuram", "Karur", "Nagercoil", "Sriperumbudur",
      "Ambattur", "Guindy", "Maraimalai Nagar", "Oragadam", "Gummidipoondi"
    ],
    "Telangana": [
      "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Ramagundam", "Khammam",
      "Mahbubnagar", "Nalgonda", "Adilabad", "Secunderabad", "Medchal",
      "Sangareddy", "Patancheru", "Kothagudem", "Cherlapally", "Jeedimetla"
    ],
    "Tripura": [
      "Agartala", "Dharmanagar", "Udaipur"
    ],
    "Uttar Pradesh": [
      "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi",
      "Prayagraj", "Bareilly", "Aligarh", "Moradabad", "Saharanpur",
      "Gorakhpur", "Noida", "Greater Noida", "Firozabad", "Jhansi",
      "Muzaffarnagar", "Mathura", "Rampur", "Shahjahanpur", "Farrukhabad",
      "Hapur", "Bulandshahr", "Modinagar", "Pilkhuwa", "Surajpur"
    ],
    "Uttarakhand": [
      "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur",
      "Rishikesh", "Pantnagar", "SIDCUL", "Sitarganj"
    ],
    "West Bengal": [
      "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman",
      "Malda", "Kharagpur", "Haldia", "Hooghly", "Raniganj", "Kalyani", "Barasat"
    ],
    // Union Territories
    "Andaman and Nicobar Islands": [
      "Port Blair"
    ],
    "Chandigarh": [
      "Chandigarh"
    ],
    "Dadra and Nagar Haveli and Daman and Diu": [
      "Daman", "Diu", "Silvassa"
    ],
    "Delhi": [
      "Delhi", "New Delhi", "North Delhi", "South Delhi", "East Delhi",
      "West Delhi", "Central Delhi", "Okhla", "Rohini", "Dwarka", "Mayapuri",
      "Naraina", "Bawana", "Narela", "Patparganj", "Kirti Nagar", "Wazirpur", "Mangolpuri"
    ],
    "Jammu and Kashmir": [
      "Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua", "Udhampur",
      "Samba", "Bari Brahmana"
    ],
    "Ladakh": [
      "Leh", "Kargil"
    ],
    "Lakshadweep": [
      "Kavaratti"
    ],
    "Puducherry": [
      "Puducherry", "Karaikal", "Mahe", "Yanam"
    ]
  };

  class IndiaLocationsManager {
    /**
     * Returns all states and UTs sorted alphabetically
     */
    static getAllStates() {
      return Object.keys(INDIA_STATES_AND_CITIES).sort((a, b) => a.localeCompare(b));
    }

    /**
     * Returns list of cities for a given state
     */
    static getCitiesForState(stateName) {
      if (!stateName) return [];
      const clean = stateName.trim().toLowerCase();
      for (const [sName, cities] of Object.entries(INDIA_STATES_AND_CITIES)) {
        if (sName.toLowerCase() === clean) {
          return [...cities].sort((a, b) => a.localeCompare(b));
        }
      }
      return [];
    }

    /**
     * Returns all cities for a list of states
     */
    static getCitiesForStates(stateNames) {
      if (!stateNames || !Array.isArray(stateNames) || stateNames.length === 0) {
        return [];
      }
      const citySet = new Set();
      stateNames.forEach(st => {
        const cities = this.getCitiesForState(st);
        cities.forEach(c => citySet.add(c));
      });
      return Array.from(citySet).sort((a, b) => a.localeCompare(b));
    }

    /**
     * Reverse lookup: Finds the state name for a given city
     */
    static findStateForCity(cityName) {
      if (!cityName) return null;
      const cleanCity = cityName.trim().toLowerCase();
      for (const [stateName, cities] of Object.entries(INDIA_STATES_AND_CITIES)) {
        for (const city of cities) {
          if (city.toLowerCase() === cleanCity) {
            return stateName;
          }
        }
      }
      return null;
    }

    /**
     * Checks if a location string matches selected states and cities:
     * - If no cities are selected for a state: ANY city in that state is accepted
     * - If cities are selected: only matching cities are accepted
     */
    static matchesLocationCriteria(locationText, states = [], cities = []) {
      if (!locationText) return false;
      const locLower = locationText.toLowerCase();

      const cleanStates = (states || []).map(s => s.trim().toLowerCase()).filter(Boolean);
      const cleanCities = (cities || []).map(c => c.trim().toLowerCase()).filter(Boolean);

      // If neither states nor cities are specified, open to all
      if (cleanStates.length === 0 && cleanCities.length === 0) {
        return true;
      }

      // Check if any specific city is matched
      if (cleanCities.length > 0) {
        for (const city of cleanCities) {
          if (locLower.includes(city)) {
            return { matched: true, type: 'city', value: city };
          }
        }
      }

      // If specific cities WERE provided and we are here, did user want ONLY those cities?
      // Rule: "if no selection in citywise, should consider all cities in that state."
      // If user selected State X with NO specific cities, ALL cities in State X are accepted!
      // But if user selected State Y with specific cities (e.g. Pune), only Pune is accepted for State Y.
      if (cleanStates.length > 0) {
        for (const st of cleanStates) {
          // Check if this state has any city constraints in cleanCities
          const stateCities = this.getCitiesForState(st).map(c => c.toLowerCase());
          const hasCityConstraintsForThisState = cleanCities.some(c => stateCities.includes(c));

          if (!hasCityConstraintsForThisState) {
            // No city selection for this state -> Accept ANY lead from this state or its cities!
            if (locLower.includes(st)) {
              return { matched: true, type: 'state', value: st };
            }
            for (const city of stateCities) {
              if (locLower.includes(city)) {
                return { matched: true, type: 'state-city', value: `${city} (${st})` };
              }
            }
          }
        }
      }

      return { matched: false };
    }
  }

  // Export to global scope
  const root = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : global);
  root.INDIA_STATES_AND_CITIES = INDIA_STATES_AND_CITIES;
  root.IndiaLocationsManager = IndiaLocationsManager;

})(typeof globalThis !== 'undefined' ? globalThis : this);

