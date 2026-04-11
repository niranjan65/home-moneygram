import { useState, useEffect } from 'react';

const CURRENCY_TO_COUNTRY = {
  AED:'ae', AFN:'af', ALL:'al', AMD:'am', ANG:'an', AOA:'ao', ARS:'ar',
  AUD:'au', AZN:'az', BAM:'ba', BBD:'bb', BDT:'bd', BGN:'bg', BHD:'bh',
  BIF:'bi', BND:'bn', BOB:'bo', BRL:'br', BSD:'bs', BTN:'bt', BWP:'bw',
  BYN:'by', BZD:'bz', CAD:'ca', CDF:'cd', CHF:'ch', CLP:'cl', CNY:'cn',
  COP:'co', CRC:'cr', CUP:'cu', CVE:'cv', CZK:'cz', DJF:'dj', DKK:'dk',
  DOP:'do', DZD:'dz', EGP:'eg', ERN:'er', ETB:'et', EUR:'eu', FJD:'fj',
  FKP:'fk', GBP:'gb', GEL:'ge', GHS:'gh', GIP:'gi', GMD:'gm', GNF:'gn',
  GTQ:'gt', GYD:'gy', HKD:'hk', HNL:'hn', HTG:'ht', HUF:'hu', IDR:'id',
  ILS:'il', INR:'in', IQD:'iq', IRR:'ir', ISK:'is', JMD:'jm', JOD:'jo',
  JPY:'jp', KES:'ke', KGS:'kg', KHR:'kh', KMF:'km', KRW:'kr', KWD:'kw',
  KYD:'ky', KZT:'kz', LAK:'la', LBP:'lb', LKR:'lk', LRD:'lr', LSL:'ls',
  LYD:'ly', MAD:'ma', MDL:'md', MGA:'mg', MKD:'mk', MMK:'mm', MNT:'mn',
  MOP:'mo', MRU:'mr', MUR:'mu', MVR:'mv', MWK:'mw', MXN:'mx', MYR:'my',
  MZN:'mz', NAD:'na', NGN:'ng', NIO:'ni', NOK:'no', NPR:'np', NZD:'nz',
  OMR:'om', PAB:'pa', PEN:'pe', PGK:'pg', PHP:'ph', PKR:'pk', PLN:'pl',
  PYG:'py', QAR:'qa', RON:'ro', RSD:'rs', RUB:'ru', RWF:'rw', SAR:'sa',
  SBD:'sb', SCR:'sc', SDG:'sd', SEK:'se', SGD:'sg', SHP:'sh', SLE:'sl',
  SOS:'so', SRD:'sr', SSP:'ss', STN:'st', SYP:'sy', SZL:'sz', THB:'th',
  TJS:'tj', TMT:'tm', TND:'tn', TOP:'to', TRY:'tr', TTD:'tt', TWD:'tw',
  TZS:'tz', UAH:'ua', UGX:'ug', USD:'us', UYU:'uy', UZS:'uz', VES:'ve',
  VND:'vn', VUV:'vu', WST:'ws', YER:'ye', ZAR:'za', ZMW:'zm',
};

// ── Get currency symbol via browser Intl — no hardcoding ─────────────────────
function getCurrencySymbol(code) {
  try {
    return (0).toLocaleString('en', {
      style:                 'currency',
      currency:              code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace(/\d/g, '').trim();
  } catch {
    return code; // fallback to code if Intl doesn't know it
  }
}

// ── Get flag URL from flagcdn.com ─────────────────────────────────────────────
function getFlagUrl(code) {
  const country = CURRENCY_TO_COUNTRY[code];
  return country
    ? `https://flagcdn.com/${country}.svg`
    : `https://flagcdn.com/un.svg`; 
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useCurrencies(baseCurrency = 'USD') {
  const [currencies, setCurrencies] = useState([]);
  const [rates, setRates]           = useState({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCurrencies = async () => {
      try {
        setLoading(true);
        setError(null);

        const res  = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
        const data = await res.json();

        if (data.result !== 'success') {
          throw new Error('API returned non-success result');
        }

        if (cancelled) return;

        setRates(data.rates);

    
        const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });

        const list = Object.keys(data.rates).map(code => {
          let name = code;
          try { name = displayNames.of(code) ?? code; } catch {}

          return {
            code,
            name,
            symbol:  getCurrencySymbol(code),
            flag:    getFlagUrl(code),
          };
        });

        list.sort((a, b) => a.code.localeCompare(b.code));

        setCurrencies(list);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCurrencies();
    return () => { cancelled = true; };
  }, [baseCurrency]);

  return { currencies, rates, loading, error };
}