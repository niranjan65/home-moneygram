/**
 * denominations.js
 * Complete denomination data for all supported countries.
 * Notes and coins are listed largest-first (required for greedy breakdown algorithm).
 * To add a country: add an entry to DENOMINATION_DATA. Everything else updates automatically.
 */

export const DENOMINATION_DATA = {

  // ── A ───────────────────────────────────────────────────────────────────────

  'United Arab Emirates': {
    currency: 'AED', symbol: 'د.إ', flag: '🇦🇪',
    notes: [1000, 500, 200, 100, 50, 20, 10, 5],
    coins: [1, 0.50, 0.25],
    pickupNote: 'Available at Emirates Post & Al Ansari Exchange',
  },
  'Afghanistan': {
    currency: 'AFN', symbol: '؋', flag: '🇦🇫',
    notes: [1000, 500, 100, 50, 20, 10, 5, 2, 1],
    coins: [5, 2, 1],
    pickupNote: 'Available at Da Afghanistan Bank branches',
  },
  'Albania': {
    currency: 'ALL', symbol: 'L', flag: '🇦🇱',
    notes: [10000, 5000, 2000, 1000, 500, 200, 100],
    coins: [100, 50, 20, 10, 5],
    pickupNote: 'Available at Raiffeisen Bank & partner outlets',
  },
  'Armenia': {
    currency: 'AMD', symbol: '֏', flag: '🇦🇲',
    notes: [100000, 50000, 20000, 10000, 5000, 1000, 500],
    coins: [500, 200, 100, 50, 20, 10],
    pickupNote: 'Available at Ameriabank & partner branches',
  },
  'Angola': {
    currency: 'AOA', symbol: 'Kz', flag: '🇦🇴',
    notes: [5000, 2000, 1000, 500, 200, 100, 50],
    coins: [50, 10, 5, 1],
    pickupNote: 'Available at Banco Angolano de Investimentos',
  },
  'Argentina': {
    currency: 'ARS', symbol: '$', flag: '🇦🇷',
    notes: [10000, 2000, 1000, 500, 200, 100, 50, 20, 10],
    coins: [10, 5, 2, 1],
    pickupNote: 'Available at Correo Argentino & partner banks',
  },
  'Australia': {
    currency: 'AUD', symbol: '$', flag: '🇦🇺',
    notes: [100, 50, 20, 10, 5],
    coins: [2, 1, 0.50, 0.20, 0.10, 0.05],
    pickupNote: 'Available at Australia Post & major bank branches',
  },
  'Azerbaijan': {
    currency: 'AZN', symbol: '₼', flag: '🇦🇿',
    notes: [200, 100, 50, 20, 10, 5, 1],
    coins: [1, 0.50, 0.20, 0.10, 0.05, 0.01],
    pickupNote: 'Available at ABB & Kapital Bank branches',
  },

  // ── B ───────────────────────────────────────────────────────────────────────

  'Bosnia and Herzegovina': {
    currency: 'BAM', symbol: 'KM', flag: '🇧🇦',
    notes: [200, 100, 50, 20, 10, 5],
    coins: [2, 1, 0.50, 0.20, 0.10, 0.05],
    pickupNote: 'Available at UniCredit & Raiffeisen branches',
  },
  'Barbados': {
    currency: 'BBD', symbol: '$', flag: '🇧🇧',
    notes: [100, 50, 20, 10, 5, 2],
    coins: [1, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Scotiabank & CIBC FirstCaribbean',
  },
  'Bangladesh': {
    currency: 'BDT', symbol: '৳', flag: '🇧🇩',
    notes: [1000, 500, 100, 50, 20, 10, 5, 2, 1],
    coins: [5, 2, 1],
    pickupNote: 'Available at Dutch-Bangla & bKash agent points',
  },
  'Bulgaria': {
    currency: 'BGN', symbol: 'лв', flag: '🇧🇬',
    notes: [100, 50, 20, 10, 5, 2],
    coins: [1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01],
    pickupNote: 'Available at Bulgarian Post & UniCredit Bulbank',
  },
  'Bahrain': {
    currency: 'BHD', symbol: 'BD', flag: '🇧🇭',
    notes: [20, 10, 5, 1, 0.50],
    coins: [0.50, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Bank of Bahrain & Kuwait branches',
  },
  'Burundi': {
    currency: 'BIF', symbol: 'Fr', flag: '🇧🇮',
    notes: [10000, 5000, 2000, 1000, 500],
    coins: [50, 10, 5],
    pickupNote: 'Available at Banque de la République du Burundi',
  },
  'Brunei': {
    currency: 'BND', symbol: '$', flag: '🇧🇳',
    notes: [10000, 1000, 500, 100, 50, 25, 10, 5, 1],
    coins: [1, 0.50, 0.20, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Baiduri Bank & Bank Islam Brunei',
  },
  'Bolivia': {
    currency: 'BOB', symbol: 'Bs', flag: '🇧🇴',
    notes: [200, 100, 50, 20, 10],
    coins: [5, 2, 1, 0.50, 0.20, 0.10],
    pickupNote: 'Available at Banco Nacional de Bolivia',
  },
  'Brazil': {
    currency: 'BRL', symbol: 'R$', flag: '🇧🇷',
    notes: [200, 100, 50, 20, 10, 5, 2],
    coins: [1, 0.50, 0.25, 0.10, 0.05],
    pickupNote: 'Available at Correios & Bradesco branches',
  },
  'Bhutan': {
    currency: 'BTN', symbol: 'Nu', flag: '🇧🇹',
    notes: [1000, 500, 100, 50, 20, 10, 5, 1],
    coins: [1, 0.50, 0.25],
    pickupNote: 'Available at Bank of Bhutan branches',
  },
  'Botswana': {
    currency: 'BWP', symbol: 'P', flag: '🇧🇼',
    notes: [200, 100, 50, 20, 10],
    coins: [5, 2, 1, 0.50, 0.25, 0.10, 0.05],
    pickupNote: 'Available at First National Bank Botswana',
  },
  'Belarus': {
    currency: 'BYN', symbol: 'Br', flag: '🇧🇾',
    notes: [500, 200, 100, 50, 20, 10, 5],
    coins: [2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01],
    pickupNote: 'Available at Belarusbank & partner outlets',
  },
  'Belize': {
    currency: 'BZD', symbol: '$', flag: '🇧🇿',
    notes: [100, 50, 20, 10, 5, 2],
    coins: [1, 0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Belize Bank & Atlantic Bank',
  },

  'Netherlands Antilles': {
    currency: 'ANG', symbol: 'ƒ', flag: '🇳🇱',
    notes: [250, 100, 50, 25, 10, 5],
    coins: [5, 2.50, 1, 0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Centrale Bank van Curaçao en Sint Maarten',
  },
  'Bahamas': {
    currency: 'BSD', symbol: '$', flag: '🇧🇸',
    notes: [100, 50, 20, 10, 5, 3, 1, 0.50],
    coins: [1, 0.25, 0.15, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Bahamas Post & Commonwealth Bank',
  },
    // ── C ───────────────────────────────────────────────────────────────────────

  'Canada': {
    currency: 'CAD', symbol: '$', flag: '🇨🇦',
    notes: [100, 50, 20, 10, 5],
    coins: [2, 1, 0.25, 0.10, 0.05],
    pickupNote: 'Available at Canada Post & TD Bank branches',
  },
  'DR Congo': {
    currency: 'CDF', symbol: 'Fr', flag: '🇨🇩',
    notes: [20000, 10000, 5000, 1000, 500],
    coins: [50, 1],
    pickupNote: 'Available at Rawbank & Equity BCDC branches',
  },
  'Switzerland': {
    currency: 'CHF', symbol: 'Fr', flag: '🇨🇭',
    notes: [1000, 200, 100, 50, 20, 10],
    coins: [5, 2, 1, 0.50, 0.20, 0.10, 0.05],
    pickupNote: 'Available at Swiss Post & UBS branches',
  },
  'Chile': {
    currency: 'CLP', symbol: '$', flag: '🇨🇱',
    notes: [20000, 10000, 5000, 2000, 1000],
    coins: [500, 100, 50, 10],
    pickupNote: 'Available at Correos de Chile & BancoEstado',
  },
  'China': {
    currency: 'CNY', symbol: '¥', flag: '🇨🇳',
    notes: [100, 50, 20, 10, 5, 1],
    coins: [1, 0.50, 0.10],
    pickupNote: 'Available at Bank of China & China Post branches',
  },
  'Colombia': {
    currency: 'COP', symbol: '$', flag: '🇨🇴',
    notes: [100000, 50000, 20000, 10000, 5000, 2000, 1000],
    coins: [1000, 500, 200, 100, 50],
    pickupNote: 'Available at Bancolombia & 4-72 outlets',
  },
  'Costa Rica': {
    currency: 'CRC', symbol: '₡', flag: '🇨🇷',
    notes: [50000, 20000, 10000, 5000, 2000, 1000],
    coins: [500, 100, 50, 25, 10, 5],
    pickupNote: 'Available at Correos de Costa Rica & BCR',
  },
  'Cuba': {
    currency: 'CUP', symbol: '$', flag: '🇨🇺',
    notes: [1000, 500, 200, 100, 50, 20, 10, 5, 3, 1],
    coins: [1, 0.40, 0.20, 0.05, 0.02, 0.01],
    pickupNote: 'Available at Cadeca exchange houses',
  },
  'Cape Verde': {
    currency: 'CVE', symbol: '$', flag: '🇨🇻',
    notes: [5000, 2000, 1000, 500, 200],
    coins: [100, 50, 20, 10, 5, 1],
    pickupNote: 'Available at Banco Comercial do Atlântico',
  },
  'Czech Republic': {
    currency: 'CZK', symbol: 'Kč', flag: '🇨🇿',
    notes: [5000, 2000, 1000, 500, 200, 100],
    coins: [50, 20, 10, 5, 2, 1],
    pickupNote: 'Available at Česká pošta & Komerční banka',
  },

  // ── D ───────────────────────────────────────────────────────────────────────

  'Djibouti': {
    currency: 'DJF', symbol: 'Fr', flag: '🇩🇯',
    notes: [10000, 5000, 2000, 1000, 500],
    coins: [500, 100, 50, 20, 10, 5, 2, 1],
    pickupNote: 'Available at Banque de Djibouti branches',
  },
  'Denmark': {
    currency: 'DKK', symbol: 'kr', flag: '🇩🇰',
    notes: [1000, 500, 200, 100, 50],
    coins: [20, 10, 5, 2, 1, 0.50],
    pickupNote: 'Available at Post Danmark & Danske Bank',
  },
  'Dominican Republic': {
    currency: 'DOP', symbol: '$', flag: '🇩🇴',
    notes: [2000, 1000, 500, 200, 100, 50],
    coins: [25, 10, 5, 1],
    pickupNote: 'Available at Banco Popular & Western Union outlets',
  },
  'Algeria': {
    currency: 'DZD', symbol: 'دج', flag: '🇩🇿',
    notes: [2000, 1000, 500, 200, 100],
    coins: [200, 100, 50, 20, 10, 5],
    pickupNote: 'Available at Algérie Poste & BNA branches',
  },

  // ── E ───────────────────────────────────────────────────────────────────────

  'Egypt': {
    currency: 'EGP', symbol: '£', flag: '🇪🇬',
    notes: [200, 100, 50, 20, 10, 5],
    coins: [1, 0.50, 0.25],
    pickupNote: 'Available at Egypt Post & Banque Misr',
  },
  'Eritrea': {
    currency: 'ERN', symbol: 'Nfk', flag: '🇪🇷',
    notes: [500, 100, 50, 20, 10, 5],
    coins: [100, 50, 25, 10, 5, 1],
    pickupNote: 'Available at Bank of Eritrea branches',
  },
  'Ethiopia': {
    currency: 'ETB', symbol: 'Br', flag: '🇪🇹',
    notes: [1000, 500, 200, 100, 50],
    coins: [1, 0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Ethiopian Postal Service & CBE',
  },
  'Eurozone': {
    currency: 'EUR', symbol: '€', flag: '🇪🇺',
    notes: [500, 200, 100, 50, 20, 10, 5],
    coins: [2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01],
    pickupNote: 'Available at partner banks & post offices',
  },

  // ── F ───────────────────────────────────────────────────────────────────────

  'Fiji': {
    currency: 'FJD', symbol: '$', flag: '🇫🇯',
    notes: [100, 50, 20, 10, 5, 2],
    coins: [2, 1, 0.50, 0.20, 0.10, 0.05],
    pickupNote: 'Available at ANZ & BSP Pacific branches',
  },
  'Falkland Islands': {
    currency: 'FKP', symbol: '£', flag: '🇫🇰',
    notes: [50, 20, 10, 5],
    coins: [2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01],
    pickupNote: 'Available at Standard Chartered Bank',
  },

  // ── G ───────────────────────────────────────────────────────────────────────

  'United Kingdom': {
    currency: 'GBP', symbol: '£', flag: '🇬🇧',
    notes: [50, 20, 10, 5],
    coins: [2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01],
    pickupNote: 'Available at Post Office & major UK banks',
  },
  'Georgia': {
    currency: 'GEL', symbol: '₾', flag: '🇬🇪',
    notes: [500, 200, 100, 50, 20, 10, 5],
    coins: [2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01],
    pickupNote: 'Available at TBC Bank & Bank of Georgia',
  },
  'Ghana': {
    currency: 'GHS', symbol: '₵', flag: '🇬🇭',
    notes: [200, 100, 50, 20, 10, 5, 2, 1],
    coins: [2, 1, 0.50, 0.20, 0.10, 0.05],
    pickupNote: 'Available at Ghana Post & Fidelity Bank',
  },
  'Gibraltar': {
    currency: 'GIP', symbol: '£', flag: '🇬🇮',
    notes: [100, 50, 20, 10, 5],
    coins: [2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01],
    pickupNote: 'Available at Barclays & NatWest Gibraltar',
  },
  'Gambia': {
    currency: 'GMD', symbol: 'D', flag: '🇬🇲',
    notes: [1000, 500, 200, 100, 50, 25],
    coins: [5, 1],
    pickupNote: 'Available at Trust Bank & Access Bank Gambia',
  },
  'Guinea': {
    currency: 'GNF', symbol: 'Fr', flag: '🇬🇳',
    notes: [20000, 10000, 5000, 1000, 500],
    coins: [25],
    pickupNote: 'Available at Ecobank Guinea branches',
  },
  'Guatemala': {
    currency: 'GTQ', symbol: 'Q', flag: '🇬🇹',
    notes: [200, 100, 50, 20, 10, 5],
    coins: [1, 0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Correos de Guatemala & Banrural',
  },
  'Guyana': {
    currency: 'GYD', symbol: '$', flag: '🇬🇾',
    notes: [5000, 2000, 1000, 500, 100, 20],
    coins: [10, 5, 1],
    pickupNote: 'Available at Guyana Post & Republic Bank',
  },

  // ── H ───────────────────────────────────────────────────────────────────────

  'Hong Kong': {
    currency: 'HKD', symbol: '$', flag: '🇭🇰',
    notes: [1000, 500, 100, 50, 20, 10],
    coins: [10, 5, 2, 1, 0.50, 0.20, 0.10],
    pickupNote: 'Available at Hongkong Post & HSBC branches',
  },
  'Honduras': {
    currency: 'HNL', symbol: 'L', flag: '🇭🇳',
    notes: [500, 200, 100, 50, 20, 10],
    coins: [5, 2, 1, 0.50, 0.20, 0.10, 0.05],
    pickupNote: 'Available at Correos de Honduras & Banpais',
  },
  'Haiti': {
    currency: 'HTG', symbol: 'G', flag: '🇭🇹',
    notes: [2500, 1000, 500, 250, 100, 50, 25, 10],
    coins: [5, 1],
    pickupNote: 'Available at BNC & Sogebank branches',
  },
  'Hungary': {
    currency: 'HUF', symbol: 'Ft', flag: '🇭🇺',
    notes: [20000, 10000, 5000, 2000, 1000, 500],
    coins: [200, 100, 50, 20, 10, 5],
    pickupNote: 'Available at Magyar Posta & OTP Bank',
  },

  // ── I ───────────────────────────────────────────────────────────────────────

  'Indonesia': {
    currency: 'IDR', symbol: 'Rp', flag: '🇮🇩',
    notes: [100000, 50000, 20000, 10000, 5000, 2000, 1000],
    coins: [1000, 500, 200, 100],
    pickupNote: 'Available at BRI, BNI & Alfamart outlets',
  },
  'Israel': {
    currency: 'ILS', symbol: '₪', flag: '🇮🇱',
    notes: [200, 100, 50, 20],
    coins: [10, 5, 2, 1, 0.50, 0.10],
    pickupNote: 'Available at Israel Post & Hapoalim Bank',
  },
  'India': {
    currency: 'INR', symbol: '₹', flag: '🇮🇳',
    notes: [500, 200, 100, 50, 20, 10],
    coins: [20, 10, 5, 2, 1],
    pickupNote: 'Available at India Post & partner bank branches',
  },
  'Iraq': {
    currency: 'IQD', symbol: 'ع.د', flag: '🇮🇶',
    notes: [50000, 25000, 10000, 5000, 1000, 500, 250],
    coins: [100, 50, 25],
    pickupNote: 'Available at Rasheed Bank & Trade Bank of Iraq',
  },
  'Iran': {
    currency: 'IRR', symbol: '﷼', flag: '🇮🇷',
    notes: [500000, 200000, 100000, 50000, 20000, 10000, 5000],
    coins: [5000, 2000, 1000, 500],
    pickupNote: 'Available at Bank Melli & Bank Saderat branches',
  },
  'Iceland': {
    currency: 'ISK', symbol: 'kr', flag: '🇮🇸',
    notes: [10000, 5000, 2000, 1000, 500],
    coins: [100, 50, 10, 5, 1],
    pickupNote: 'Available at Íslandsbanki & Landsbankinn',
  },

  // ── J ───────────────────────────────────────────────────────────────────────

  'Jamaica': {
    currency: 'JMD', symbol: '$', flag: '🇯🇲',
    notes: [5000, 1000, 500, 100, 50],
    coins: [20, 10, 5, 1],
    pickupNote: 'Available at Jamaica Post & National Commercial Bank',
  },
  'Jordan': {
    currency: 'JOD', symbol: 'JD', flag: '🇯🇴',
    notes: [50, 20, 10, 5, 1],
    coins: [0.50, 0.25, 0.10, 0.05],
    pickupNote: 'Available at Jordan Post & Arab Bank',
  },
  'Japan': {
    currency: 'JPY', symbol: '¥', flag: '🇯🇵',
    notes: [10000, 5000, 2000, 1000],
    coins: [500, 100, 50, 10, 5, 1],
    pickupNote: 'Available at Japan Post & 7-Eleven ATMs',
  },

  // ── K ───────────────────────────────────────────────────────────────────────

  'Kenya': {
    currency: 'KES', symbol: 'KSh', flag: '🇰🇪',
    notes: [1000, 500, 200, 100, 50],
    coins: [40, 20, 10, 5, 1],
    pickupNote: 'Available at Posta Kenya & Equity Bank',
  },
  'Kyrgyzstan': {
    currency: 'KGS', symbol: 'с', flag: '🇰🇬',
    notes: [5000, 2000, 1000, 500, 200, 100, 50, 20],
    coins: [10, 5, 3, 1],
    pickupNote: 'Available at Kyrgyzpost & Optima Bank',
  },
  'Cambodia': {
    currency: 'KHR', symbol: '៛', flag: '🇰🇭',
    notes: [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 100],
    coins: [500, 200, 100, 50],
    pickupNote: 'Available at ACLEDA Bank & Wing branches',
  },
  'Comoros': {
    currency: 'KMF', symbol: 'Fr', flag: '🇰🇲',
    notes: [10000, 5000, 2000, 1000, 500],
    coins: [250, 100, 50, 25, 10, 5],
    pickupNote: 'Available at Banque de Développement des Comores',
  },
  'South Korea': {
    currency: 'KRW', symbol: '₩', flag: '🇰🇷',
    notes: [50000, 10000, 5000, 1000],
    coins: [500, 100, 50, 10],
    pickupNote: 'Available at Korea Post & KEB Hana Bank',
  },
  'Kuwait': {
    currency: 'KWD', symbol: 'KD', flag: '🇰🇼',
    notes: [20, 10, 5, 1, 0.50, 0.25, 0.20, 0.10],
    coins: [0.10, 0.05],
    pickupNote: 'Available at Kuwait Finance House & NBK',
  },
  'Cayman Islands': {
    currency: 'KYD', symbol: '$', flag: '🇰🇾',
    notes: [100, 50, 25, 10, 5, 1],
    coins: [0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Cayman National Bank',
  },
  'Kazakhstan': {
    currency: 'KZT', symbol: '₸', flag: '🇰🇿',
    notes: [20000, 10000, 5000, 2000, 1000, 500, 200, 100],
    coins: [100, 50, 20, 10, 5, 2, 1],
    pickupNote: 'Available at Kazpost & Halyk Bank',
  },

  // ── L ───────────────────────────────────────────────────────────────────────

  'Laos': {
    currency: 'LAK', symbol: '₭', flag: '🇱🇦',
    notes: [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500],
    coins: [500, 100, 50, 20, 10],
    pickupNote: 'Available at Banque pour le Commerce Extérieur Lao',
  },
  'Lebanon': {
    currency: 'LBP', symbol: 'ل.ل', flag: '🇱🇧',
    notes: [100000, 50000, 20000, 10000, 5000],
    coins: [1000, 500, 250],
    pickupNote: 'Available at LibanPost & Fransabank branches',
  },
  'Sri Lanka': {
    currency: 'LKR', symbol: 'Rs', flag: '🇱🇰',
    notes: [5000, 2000, 1000, 500, 100, 50, 20, 10],
    coins: [10, 5, 2, 1],
    pickupNote: 'Available at Sri Lanka Post & Sampath Bank',
  },
  'Liberia': {
    currency: 'LRD', symbol: '$', flag: '🇱🇷',
    notes: [500, 100, 50, 20, 10, 5],
    coins: [1, 0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Liberia Bank for Development',
  },
  'Lesotho': {
    currency: 'LSL', symbol: 'L', flag: '🇱🇸',
    notes: [200, 100, 50, 20, 10],
    coins: [5, 2, 1, 0.50, 0.20, 0.10, 0.05],
    pickupNote: 'Available at Lesotho Post Bank & Standard Bank',
  },
  'Libya': {
    currency: 'LYD', symbol: 'LD', flag: '🇱🇾',
    notes: [50, 20, 10, 5, 1],
    coins: [0.50, 0.10, 0.05],
    pickupNote: 'Available at Central Bank of Libya branches',
  },

  // ── M ───────────────────────────────────────────────────────────────────────

  'Morocco': {
    currency: 'MAD', symbol: 'MAD', flag: '🇲🇦',
    notes: [200, 100, 50, 20],
    coins: [10, 5, 2, 1, 0.50, 0.20, 0.10, 0.05],
    pickupNote: 'Available at Barid Al-Maghrib & CIH Bank',
  },
  'Moldova': {
    currency: 'MDL', symbol: 'L', flag: '🇲🇩',
    notes: [1000, 500, 200, 100, 50, 20, 10, 5],
    coins: [10, 5, 2, 1, 0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Poșta Moldovei & Moldova Agroindbank',
  },
  'Madagascar': {
    currency: 'MGA', symbol: 'Ar', flag: '🇲🇬',
    notes: [20000, 10000, 5000, 2000, 1000, 500, 200, 100],
    coins: [500, 200, 100, 50, 20, 10, 5, 2, 1],
    pickupNote: 'Available at Paositra Malagasy & BNI Madagascar',
  },
  'North Macedonia': {
    currency: 'MKD', symbol: 'ден', flag: '🇲🇰',
    notes: [5000, 2000, 1000, 500, 200, 100, 50, 10],
    coins: [50, 10, 5, 2, 1],
    pickupNote: 'Available at Makedonska Poshta & NLB Banka',
  },
  'Myanmar': {
    currency: 'MMK', symbol: 'K', flag: '🇲🇲',
    notes: [20000, 10000, 5000, 1000, 500, 200, 100, 50, 20, 10, 5, 1],
    coins: [100, 50],
    pickupNote: 'Available at KBZ Bank & CB Bank branches',
  },
  'Mongolia': {
    currency: 'MNT', symbol: '₮', flag: '🇲🇳',
    notes: [20000, 10000, 5000, 1000, 500, 100, 50, 20, 10],
    coins: [500, 200, 100, 50, 20],
    pickupNote: 'Available at Mongol Post & Khan Bank',
  },
  'Macau': {
    currency: 'MOP', symbol: 'P', flag: '🇲🇴',
    notes: [1000, 500, 100, 50, 20, 10],
    coins: [5, 2, 1, 0.50, 0.10],
    pickupNote: 'Available at CTM & Banco Nacional Ultramarino',
  },
  'Mauritania': {
    currency: 'MRU', symbol: 'UM', flag: '🇲🇷',
    notes: [5000, 2000, 1000, 500, 200, 100, 50],
    coins: [20, 10, 5, 1],
    pickupNote: 'Available at Mauripost & Banque Mauritanienne',
  },
  'Mauritius': {
    currency: 'MUR', symbol: 'Rs', flag: '🇲🇺',
    notes: [5000, 2000, 1000, 500, 200, 100, 50, 25],
    coins: [20, 10, 5, 1, 0.50, 0.25],
    pickupNote: 'Available at Mauritius Post & MCB branches',
  },
  'Maldives': {
    currency: 'MVR', symbol: 'Rf', flag: '🇲🇻',
    notes: [1000, 500, 100, 50, 20, 10, 5],
    coins: [2, 1, 0.50, 0.25, 0.10, 0.01],
    pickupNote: 'Available at Maldives Post & Bank of Maldives',
  },
  'Malawi': {
    currency: 'MWK', symbol: 'MK', flag: '🇲🇼',
    notes: [10000, 5000, 2000, 1000, 500, 200],
    coins: [10, 5, 1],
    pickupNote: 'Available at Malawi Post & National Bank of Malawi',
  },
  'Mexico': {
    currency: 'MXN', symbol: '$', flag: '🇲🇽',
    notes: [1000, 500, 200, 100, 50, 20],
    coins: [10, 5, 2, 1, 0.50],
    pickupNote: 'Available at OXXO, Elektra & partner branches',
  },
  'Malaysia': {
    currency: 'MYR', symbol: 'RM', flag: '🇲🇾',
    notes: [100, 50, 20, 10, 5, 1],
    coins: [1, 0.50, 0.20, 0.10, 0.05],
    pickupNote: 'Available at Pos Malaysia & Maybank branches',
  },
  'Mozambique': {
    currency: 'MZN', symbol: 'MT', flag: '🇲🇿',
    notes: [1000, 500, 200, 100, 50, 20],
    coins: [10, 5, 2, 1, 0.50, 0.20, 0.10],
    pickupNote: 'Available at Correios de Moçambique & BCI',
  },

  // ── N ───────────────────────────────────────────────────────────────────────

  'Namibia': {
    currency: 'NAD', symbol: '$', flag: '🇳🇦',
    notes: [200, 100, 50, 20, 10],
    coins: [5, 2, 1, 0.50, 0.10, 0.05],
    pickupNote: 'Available at Namibia Post & FNB Namibia',
  },
  'Nigeria': {
    currency: 'NGN', symbol: '₦', flag: '🇳🇬',
    notes: [1000, 500, 200, 100, 50, 20, 10, 5],
    coins: [2, 1, 0.50],
    pickupNote: 'Available at NIPOST & Access Bank branches',
  },
  'Nicaragua': {
    currency: 'NIO', symbol: 'C$', flag: '🇳🇮',
    notes: [1000, 500, 200, 100, 50],
    coins: [10, 5, 1, 0.50, 0.25, 0.10, 0.05],
    pickupNote: 'Available at Correos de Nicaragua & BAC branches',
  },
  'Norway': {
    currency: 'NOK', symbol: 'kr', flag: '🇳🇴',
    notes: [1000, 500, 200, 100, 50],
    coins: [20, 10, 5, 1],
    pickupNote: 'Available at Posten Norge & DNB Bank',
  },
  'Nepal': {
    currency: 'NPR', symbol: 'Rs', flag: '🇳🇵',
    notes: [1000, 500, 250, 100, 50, 20, 10, 5, 2, 1],
    coins: [10, 5, 2, 1],
    pickupNote: 'Available at Nepal Post & Himalayan Bank',
  },
  'New Zealand': {
    currency: 'NZD', symbol: '$', flag: '🇳🇿',
    notes: [100, 50, 20, 10, 5],
    coins: [2, 1, 0.50, 0.20, 0.10],
    pickupNote: 'Available at NZ Post & ANZ Bank branches',
  },

  // ── O ───────────────────────────────────────────────────────────────────────

  'Oman': {
    currency: 'OMR', symbol: 'ر.ع.', flag: '🇴🇲',
    notes: [50, 20, 10, 5, 1],
    coins: [0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Oman Post & Bank Muscat branches',
  },

  // ── P ───────────────────────────────────────────────────────────────────────

  'Panama': {
    currency: 'PAB', symbol: 'B/.', flag: '🇵🇦',
    notes: [100, 50, 20, 10, 5, 1],
    coins: [0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Correos y Telégrafos & Banistmo',
  },
  'Peru': {
    currency: 'PEN', symbol: 'S/.', flag: '🇵🇪',
    notes: [200, 100, 50, 20, 10],
    coins: [5, 2, 1, 0.50, 0.20, 0.10],
    pickupNote: 'Available at Serpost & BCP branches',
  },
  'Papua New Guinea': {
    currency: 'PGK', symbol: 'K', flag: '🇵🇬',
    notes: [100, 50, 20, 10, 5, 2],
    coins: [1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01],
    pickupNote: 'Available at Post PNG & BSP branches',
  },
  'Philippines': {
    currency: 'PHP', symbol: '₱', flag: '🇵🇭',
    notes: [1000, 500, 200, 100, 50, 20],
    coins: [20, 10, 5, 1, 0.25],
    pickupNote: 'Available at LBC, Palawan Pawnshop & SM outlets',
  },
  'Pakistan': {
    currency: 'PKR', symbol: 'Rs', flag: '🇵🇰',
    notes: [5000, 1000, 500, 100, 75, 50],
    coins: [10, 5, 2, 1],
    pickupNote: 'Available at Pakistan Post & HBL branches',
  },
  'Poland': {
    currency: 'PLN', symbol: 'zł', flag: '🇵🇱',
    notes: [500, 200, 100, 50, 20, 10],
    coins: [5, 2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01],
    pickupNote: 'Available at Poczta Polska & PKO Bank Polski',
  },
  'Paraguay': {
    currency: 'PYG', symbol: '₲', flag: '🇵🇾',
    notes: [100000, 50000, 20000, 10000, 5000, 2000, 1000],
    coins: [500, 100, 50],
    pickupNote: 'Available at Correo Paraguayo & BNF',
  },

  // ── Q ───────────────────────────────────────────────────────────────────────

  'Qatar': {
    currency: 'QAR', symbol: 'ر.ق', flag: '🇶🇦',
    notes: [500, 100, 50, 10, 5, 1],
    coins: [1, 0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Qatar Post & QNB branches',
  },

  // ── R ───────────────────────────────────────────────────────────────────────

  'Romania': {
    currency: 'RON', symbol: 'lei', flag: '🇷🇴',
    notes: [500, 200, 100, 50, 10, 5, 1],
    coins: [0.50, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Poșta Română & BCR branches',
  },
  'Serbia': {
    currency: 'RSD', symbol: 'din', flag: '🇷🇸',
    notes: [5000, 2000, 1000, 500, 200, 100, 50, 20, 10],
    coins: [20, 10, 5, 2, 1],
    pickupNote: 'Available at Pošta Srbije & Banca Intesa',
  },
  'Russia': {
    currency: 'RUB', symbol: '₽', flag: '🇷🇺',
    notes: [5000, 2000, 1000, 500, 200, 100, 50],
    coins: [10, 5, 2, 1, 0.50, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Pochta Bank & Sberbank branches',
  },
  'Rwanda': {
    currency: 'RWF', symbol: 'Fr', flag: '🇷🇼',
    notes: [5000, 2000, 1000, 500],
    coins: [100, 50, 20, 10, 5],
    pickupNote: 'Available at Rwanda Post & Bank of Kigali',
  },

  // ── S ───────────────────────────────────────────────────────────────────────

  'Saudi Arabia': {
    currency: 'SAR', symbol: 'ر.س', flag: '🇸🇦',
    notes: [500, 200, 100, 50, 20, 10, 5, 1],
    coins: [2, 1, 0.50, 0.25],
    pickupNote: 'Available at Saudi Post & Al Rajhi Bank',
  },
  'Solomon Islands': {
    currency: 'SBD', symbol: '$', flag: '🇸🇧',
    notes: [100, 50, 20, 10, 5, 2],
    coins: [1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01],
    pickupNote: 'Available at ANZ & BSP Solomon Islands',
  },
  'Seychelles': {
    currency: 'SCR', symbol: 'Rs', flag: '🇸🇨',
    notes: [500, 200, 100, 50, 25],
    coins: [10, 5, 1, 0.25],
    pickupNote: 'Available at Seychelles Post & MCB Seychelles',
  },
  'Sudan': {
    currency: 'SDG', symbol: 'ج.س', flag: '🇸🇩',
    notes: [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1],
    coins: [1, 0.50, 0.25, 0.10, 0.05],
    pickupNote: 'Available at Sudan Post & Bank of Khartoum',
  },
  'Sweden': {
    currency: 'SEK', symbol: 'kr', flag: '🇸🇪',
    notes: [1000, 500, 200, 100, 50, 20],
    coins: [10, 5, 2, 1],
    pickupNote: 'Available at PostNord & Swedbank branches',
  },
  'Singapore': {
    currency: 'SGD', symbol: '$', flag: '🇸🇬',
    notes: [10000, 1000, 100, 50, 20, 10, 5, 2],
    coins: [1, 0.50, 0.20, 0.10, 0.05],
    pickupNote: 'Available at Singapore Post & DBS Bank',
  },
  'Saint Helena': {
    currency: 'SHP', symbol: '£', flag: '🇸🇭',
    notes: [50, 20, 10, 5],
    coins: [2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01],
    pickupNote: 'Available at Bank of Saint Helena',
  },
  'Sierra Leone': {
    currency: 'SLE', symbol: 'Le', flag: '🇸🇱',
    notes: [200, 100, 50, 20, 10],
    coins: [1, 0.50],
    pickupNote: 'Available at Sierra Leone Post & Rokel Commercial Bank',
  },
  'Somalia': {
    currency: 'SOS', symbol: 'Sh', flag: '🇸🇴',
    notes: [1000, 500, 100, 50, 20, 10, 5],
    coins: [1],
    pickupNote: 'Available at Dahabshiil & Salaam Somali Bank',
  },
  'Suriname': {
    currency: 'SRD', symbol: '$', flag: '🇸🇷',
    notes: [100, 50, 20, 10, 5],
    coins: [1, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Telesur & De Surinaamsche Bank',
  },
  'South Sudan': {
    currency: 'SSP', symbol: '£', flag: '🇸🇸',
    notes: [1000, 500, 100, 50, 25, 10, 5],
    coins: [1],
    pickupNote: 'Available at Bank of South Sudan branches',
  },
  'São Tomé & Príncipe': {
    currency: 'STN', symbol: 'Db', flag: '🇸🇹',
    notes: [500, 200, 100, 50, 20, 10, 5],
    coins: [2, 1, 0.50, 0.20, 0.10],
    pickupNote: 'Available at Correios de São Tomé & BISTP',
  },
  'Syria': {
    currency: 'SYP', symbol: '£', flag: '🇸🇾',
    notes: [5000, 2000, 1000, 500, 200, 100, 50],
    coins: [25, 10, 5, 2, 1],
    pickupNote: 'Available at Syrian Post & Commercial Bank of Syria',
  },
  'Eswatini': {
    currency: 'SZL', symbol: 'L', flag: '🇸🇿',
    notes: [200, 100, 50, 20, 10],
    coins: [5, 2, 1, 0.50, 0.20, 0.10, 0.05],
    pickupNote: 'Available at Eswatini Post & First National Bank',
  },

  // ── T ───────────────────────────────────────────────────────────────────────

  'Thailand': {
    currency: 'THB', symbol: '฿', flag: '🇹🇭',
    notes: [1000, 500, 100, 50, 20],
    coins: [10, 5, 2, 1, 0.50, 0.25],
    pickupNote: 'Available at Thailand Post & Bangkok Bank',
  },
  'Tajikistan': {
    currency: 'TJS', symbol: 'SM', flag: '🇹🇯',
    notes: [500, 200, 100, 50, 20, 10, 5],
    coins: [5, 3, 2, 1, 0.50, 0.25, 0.10, 0.05],
    pickupNote: 'Available at Tajikpost & Eskhata Bank',
  },
  'Turkmenistan': {
    currency: 'TMT', symbol: 'T', flag: '🇹🇲',
    notes: [500, 100, 50, 20, 10, 5, 1],
    coins: [2, 1, 0.50, 0.20, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Türkmenpoçta & Halkbank branches',
  },
  'Tunisia': {
    currency: 'TND', symbol: 'DT', flag: '🇹🇳',
    notes: [50, 20, 10, 5],
    coins: [5, 2, 1, 0.50, 0.20, 0.10, 0.05],
    pickupNote: 'Available at La Poste Tunisienne & STB Bank',
  },
  'Tonga': {
    currency: 'TOP', symbol: 'T$', flag: '🇹🇴',
    notes: [100, 50, 20, 10, 5, 2],
    coins: [2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01],
    pickupNote: 'Available at Tonga Post & Westpac Tonga',
  },
  'Turkey': {
    currency: 'TRY', symbol: '₺', flag: '🇹🇷',
    notes: [500, 200, 100, 50, 20, 10, 5],
    coins: [1, 0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at PTT & Ziraat Bankası branches',
  },
  'Trinidad and Tobago': {
    currency: 'TTD', symbol: '$', flag: '🇹🇹',
    notes: [1000, 500, 100, 50, 20, 10, 5, 1],
    coins: [1, 0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at TSTT & Republic Bank branches',
  },
  'Taiwan': {
    currency: 'TWD', symbol: '$', flag: '🇹🇼',
    notes: [2000, 1000, 500, 200, 100],
    coins: [50, 20, 10, 5, 1],
    pickupNote: 'Available at Chunghwa Post & CTBC Bank',
  },
  'Tanzania': {
    currency: 'TZS', symbol: 'Sh', flag: '🇹🇿',
    notes: [10000, 5000, 2000, 1000, 500],
    coins: [200, 100, 50],
    pickupNote: 'Available at Tanzania Post & CRDB Bank',
  },

  // ── U ───────────────────────────────────────────────────────────────────────

  'Ukraine': {
    currency: 'UAH', symbol: '₴', flag: '🇺🇦',
    notes: [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1],
    coins: [10, 5, 2, 1, 0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Ukrposhta & PrivatBank branches',
  },
  'Uganda': {
    currency: 'UGX', symbol: 'Sh', flag: '🇺🇬',
    notes: [50000, 20000, 10000, 5000, 2000, 1000],
    coins: [500, 200, 100, 50],
    pickupNote: 'Available at Uganda Post & Stanbic Bank',
  },
  'United States': {
    currency: 'USD', symbol: '$', flag: '🇺🇸',
    notes: [100, 50, 20, 10, 5, 2, 1],
    coins: [1, 0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Western Union & MoneyGram locations',
  },
  'Uruguay': {
    currency: 'UYU', symbol: '$', flag: '🇺🇾',
    notes: [2000, 1000, 500, 200, 100, 50, 20],
    coins: [10, 5, 2, 1, 0.50, 0.20, 0.10],
    pickupNote: 'Available at Correo Uruguayo & BROU branches',
  },
  'Uzbekistan': {
    currency: 'UZS', symbol: 'лв', flag: '🇺🇿',
    notes: [100000, 50000, 10000, 5000, 1000, 500, 200, 100, 50],
    coins: [500, 200, 100, 50, 25, 10, 5],
    pickupNote: 'Available at Uzbekiston Pochtasi & Asaka Bank',
  },

  // ── V ───────────────────────────────────────────────────────────────────────

  'Venezuela': {
    currency: 'VES', symbol: 'Bs.S', flag: '🇻🇪',
    notes: [500, 200, 100, 50, 20, 10, 5],
    coins: [1, 0.50, 0.25, 0.10, 0.05, 0.01],
    pickupNote: 'Available at Correos de Venezuela & Banco de Venezuela',
  },
  'Vietnam': {
    currency: 'VND', symbol: '₫', flag: '🇻🇳',
    notes: [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000],
    coins: [5000, 2000, 1000],
    pickupNote: 'Available at Vietnam Post & Vietcombank branches',
  },
  'Vanuatu': {
    currency: 'VUV', symbol: 'Vt', flag: '🇻🇺',
    notes: [10000, 5000, 2000, 1000, 500, 200],
    coins: [100, 50, 20, 10, 5, 2, 1],
    pickupNote: 'Available at Vanuatu Post & ANZ Vanuatu',
  },

  // ── W ───────────────────────────────────────────────────────────────────────

  'Samoa': {
    currency: 'WST', symbol: 'T', flag: '🇼🇸',
    notes: [100, 50, 20, 10, 5, 2],
    coins: [1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01],
    pickupNote: 'Available at Samoa Post & ANZ Samoa',
  },

  // ── Y ───────────────────────────────────────────────────────────────────────

  'Yemen': {
    currency: 'YER', symbol: '﷼', flag: '🇾🇪',
    notes: [1000, 500, 250, 200, 100, 50],
    coins: [10, 5, 1],
    pickupNote: 'Available at Yemen Post & Al-Amal Microfinance Bank',
  },

  // ── Z ───────────────────────────────────────────────────────────────────────

  'South Africa': {
    currency: 'ZAR', symbol: 'R', flag: '🇿🇦',
    notes: [200, 100, 50, 20, 10],
    coins: [5, 2, 1, 0.50, 0.20, 0.10, 0.05],
    pickupNote: 'Available at South African Post Office & Absa Bank',
  },
  'Zambia': {
    currency: 'ZMW', symbol: 'ZK', flag: '🇿🇲',
    notes: [100, 50, 20, 10, 5, 2],
    coins: [1, 0.50, 0.10, 0.05],
    pickupNote: 'Available at Zambia Post & Zanaco branches',
  },
};

/**
 * Sorted country list for dropdowns.
 * Adding a country above automatically includes it here.
 */
export const SUPPORTED_COUNTRIES = Object.keys(DENOMINATION_DATA).sort();

/**
 * Lookup helper — returns null if country not supported.
 */
export const getDenominationInfo = (country) => DENOMINATION_DATA[country] ?? null;