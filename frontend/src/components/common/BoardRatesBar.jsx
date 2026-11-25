import React, { useMemo, useContext } from 'react';
import { useERPNextRates } from '../../hooks/useERPNextRates';
import { useBaseCurrency } from '../../hooks/useDenomination';
import { ExchangeContext } from '../../context/ExchangeContext';

/**
 * Self-contained Board Rates Bar with scrolling marquee.
 *
 * Automatically fetches live exchange rates and base currency from the backend.
 * Zero required props and zero dependency on parent components or contexts.
 * When live data is unavailable, renders a red message stating "Unable to get latest data".
 *
 * @param {Object} props
 * @param {'BUY'|'SELL'} [props.exchangeType] - Optional exchange type ('BUY' or 'SELL'). Defaults to 'BUY' (or detected from ExchangeContext).
 * @param {string} [props.baseCurrency] - Optional base currency override. Defaults to backend base currency or 'FJD'.
 * @param {string} [props.title] - Optional title label override. Defaults to "Board rates · 1 unit in <BASE_CURRENCY>".
 * @param {Array<{code: string, rate: string|number}>} [props.currencies] - Optional static currency list override.
 * @param {string} [props.errorMessage] - Custom error message to show when no live data is available. Defaults to "Unable to get latest data".
 * @param {number} [props.speed=40] - Marquee scroll cycle speed in seconds.
 * @param {string} [props.className=''] - Additional CSS classes.
 * @param {React.CSSProperties} [props.style] - Additional inline styles.
 */
export default function BoardRatesBar({
  exchangeType: propExchangeType,
  baseCurrency: propBaseCurrency,
  title: propTitle,
  currencies: propCurrencies,
  errorMessage,
  speed = 40,
  className = '',
  style = {},
}) {
  // 1. Fetch live backend exchange rates
  const ratesData = useERPNextRates();

  // 2. Fetch base currency information (e.g. FJD)
  const { data: baseCurrencyInfo } = useBaseCurrency();

  // 3. Detect exchange type safely without throwing if ExchangeContext isn't available
  const exchangeCtx = useContext(ExchangeContext);
  const effectiveExchangeType =
    propExchangeType || exchangeCtx?.exchangeType || 'BUY';

  // 4. Determine base currency display
  const effectiveBaseCurrency =
    propBaseCurrency || baseCurrencyInfo?.currency || 'FJD';

  // 5. Derive the board rates list from live data (no fallback mock values)
  const displayCurrencies = useMemo(() => {
    if (propCurrencies && Array.isArray(propCurrencies) && propCurrencies.length > 0) {
      return propCurrencies.map((c) => ({
        code: c.code,
        rate: c.rate !== undefined && c.rate !== null ? String(c.rate) : '—',
      }));
    }

    if (ratesData?.availableCurrencies && ratesData.availableCurrencies.length > 0) {
      return ratesData.availableCurrencies.map((c) => {
        const rate =
          effectiveExchangeType === 'SELL'
            ? (c.sellingRate ?? c.buyingRate)
            : (c.buyingRate ?? c.sellingRate);
        return {
          code: c.code,
          rate: rate ? Number(rate).toFixed(4) : '—',
        };
      });
    }

    return [];
  }, [propCurrencies, ratesData?.availableCurrencies, effectiveExchangeType]);

  const displayTitle =
    propTitle || `Board rates · 1 unit in ${effectiveBaseCurrency}`;

  const hasRates = displayCurrencies.length > 0;

  return (
    <div
      className={`card board-rates-bar flex items-center gap-4 py-3 px-5 overflow-hidden mb-0 ${className}`.trim()}
      style={{
        fontSize: 'var(--text-label, 14px)',
        ...style,
      }}
    >
      <style>{`
        @keyframes boardRateMarqueeAnim {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .board-rates-bar .marquee-container {
          overflow: hidden;
          position: relative;
          width: 100%;
          min-width: 0;
          mask-image: linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent);
        }
        .board-rates-bar .marquee-track {
          display: flex;
          align-items: center;
          gap: 12px;
          width: max-content;
          animation: boardRateMarqueeAnim ${speed}s linear infinite;
        }
        .board-rates-bar .marquee-track:hover {
          animation-play-state: paused;
        }
        .board-rates-bar .chip {
          display: inline-flex;
          align-items: center;
          height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          font-weight: 600;
          background: var(--color-chip);
          color: var(--color-ink-soft);
        }
      `}</style>

      {/* Label section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          paddingRight: '14px',
          borderRight: '1.5px solid var(--color-line)',
        }}
      >
        <strong style={{ fontSize: 'var(--text-label, 14px)', color: 'var(--color-ink)' }}>
          {displayTitle}
        </strong>
      </div>

      {/* Scrolling Marquee or Red Error Message */}
      {hasRates ? (
        <div className="marquee-container">
          <div className="marquee-track">
            {displayCurrencies.map((c, idx) => (
              <span
                key={`curr-1-${c.code}-${idx}`}
                className="chip gap-1"
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                <strong style={{ color: 'var(--color-ink)' }}>{c.code}</strong>
                <span style={{ color: 'var(--color-ink)' }}>{c.rate}</span>
              </span>
            ))}
            {displayCurrencies.map((c, idx) => (
              <span
                key={`curr-2-${c.code}-${idx}`}
                className="chip gap-1"
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                <strong style={{ color: 'var(--color-ink)' }}>{c.code}</strong>
                <span style={{ color: 'var(--color-ink)' }}>{c.rate}</span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 'var(--text-label, 14px)',
          }}
        >
          {ratesData?.loading ? (
            <span style={{ color: 'var(--color-muted)' }}>Loading exchange rates...</span>
          ) : (
            <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
              {errorMessage || 'Unable to get latest data'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export { BoardRatesBar };
