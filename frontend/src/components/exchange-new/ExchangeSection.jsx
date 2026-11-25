import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  ArrowLeftRight,
  TrendingUp,
  Coins,
  AlertCircle,
  ChevronDown,
  Wallet,
} from 'lucide-react';
import { ErrorMsg, CurrencyInput } from './FormUtilities';
import ComboBox from '../common/ComboBox';

export const ExchangeSection = ({
  exchangeType,
  availableCurrencies,
  ratesLoading,
  rateError,
  toCurrency,
  setToCurrency,
  useManualRate,
  setManualRate,
  sendAmount,
  setSendAmount,
  sendAmountError,
  setSendAmountError,
  effectiveRate,
  exchangePreview,
  onAmountBlur,
}) => {
  const { register, setValue, formState: { errors } } = useFormContext();
  const FJD = { code: 'FJD', symbol: 'FJ$' };

  const exchangeTypes = [
    { key: 'BUY', label: 'Buy Forex', Icon: TrendingUp },
    { key: 'SELL', label: 'Sell Forex', Icon: ArrowLeftRight },
  ];

  const currentRateDisplay =
    effectiveRate ||
    (exchangeType === 'BUY' ? toCurrency?.buyingRate : toCurrency?.sellingRate) ||
    '';

  return (
    <div className="flex flex-col gap-5">
      {/* Hidden input to keep exchangeType registered with react-hook-form */}
      <input type="hidden" {...register('exchangeType', { required: 'Please select an Exchange type' })} />
      <ErrorMsg message={errors.exchangeType?.message} />

      <p className="text-caption text-muted">Enter the transaction amount and select currency</p>
      {/* Currency & Amount Card */}
      <div className="bg-surface">
        {/* Rate Banner */}
        {toCurrency && currentRateDisplay && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-surface-alt border border-line rounded-xl mb-4.5">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-brand-600 shrink-0" />
              <span className="text-caption text-muted font-normal">Rate:</span>
              <span className="text-body font-bold text-ink tnum">
                1 {FJD.symbol} = {Number(currentRateDisplay).toFixed(4)} {toCurrency.code}
              </span>
            </div>
            <span className="text-overline font-semibold text-brand-600 bg-danger-bg border border-danger-border px-2 py-0.5 rounded tracking-wide uppercase">
              {exchangeType === 'BUY' ? 'BUY RATE' : 'SELL RATE'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_1fr] items-start gap-3 sm:gap-4">
          {/* Column 1: Currency Selector */}
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-1.5 text-label font-semibold text-ink">
              <Coins size={14} className="text-brand-600 shrink-0" />
              <span>Currency</span>
              <span className="text-brand-600 font-bold">*</span>
            </label>

            {rateError ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-danger-bg border border-danger-border rounded-lg text-danger-fg text-label">
                <AlertCircle size={14} />
                {rateError}
              </div>
            ) : ratesLoading ? (
              <div className="h-12 rounded-xl animate-pulse bg-chip" />
            ) : availableCurrencies?.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-warning-bg border border-warning-border rounded-lg text-warning-fg text-label">
                <AlertCircle size={14} />
                No rates for today — enter manually below
              </div>
            ) : (
              <ComboBox
                options={availableCurrencies || []}
                value={toCurrency?.code}
                onChange={(found) => {
                  setToCurrency(found ?? null);
                  if (!useManualRate) setManualRate('');
                }}
                placeholder="— Search or select currency —"
                getOptionLabel={(c) =>
                  `${c.code} — ${exchangeType === 'BUY' ? `Buy: ${Number(c.buyingRate).toFixed(4) ?? '—'}` : `Sell: ${Number(c.sellingRate).toFixed(4) ?? '—'}`}`
                }
                getOptionValue={(c) => c.code}
                renderOption={(c, isSelected, isHighlighted) => (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-body ${isHighlighted ? 'text-brand-600' : 'text-ink'}`}>
                        {c.code}
                      </span>
                      {c.country && (
                        <span className="text-caption text-muted truncate max-w-[130px]">
                          {c.country}
                        </span>
                      )}
                    </div>
                    <span className="text-caption font-semibold px-2 py-0.5 rounded bg-chip text-ink font-mono tnum">
                      {exchangeType === 'BUY'
                        ? `Buy: ${Number(c.buyingRate).toFixed(4) ?? '—'}`
                        : `Sell: ${Number(c.sellingRate).toFixed(4) ?? '—'}`}
                    </span>
                  </div>
                )}
                className={`w-full min-w-0 box-border bg-surface border-2 ${toCurrency ? 'border-brand-600' : 'border-line'
                  } text-ink rounded-xl h-12 px-3.5 pr-14 text-body font-semibold focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors cursor-pointer`}
              />
            )}
          </div>

          {/* Column 2: Amount (Forex) */}
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-1.5 text-label font-semibold text-ink">
              <Coins size={14} className="text-brand-600 shrink-0" />
              <span>
                {exchangeType === 'SELL'
                  ? `MH Pays`
                  : `MH Receives`}
              </span>
              <span className="text-brand-600 font-bold">*</span>
            </label>

            <div id="field-sendAmount" className="relative">
              <CurrencyInput
                id="input-sendAmount"
                value={sendAmount}
                onChange={e => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setSendAmount('');
                    setSendAmountError('');
                  } else {
                    const val = parseFloat(raw);
                    setSendAmount(raw);
                    setSendAmountError(!isNaN(val) && val > 0 ? '' : 'Please enter a valid amount');
                  }
                }}
                onBlur={() => {
                  if (Number(sendAmount) > 0) onAmountBlur?.();
                }}
                placeholder="Enter amount"
                className={`w-full min-w-0 box-border bg-surface border ${sendAmountError ? 'border-danger-border bg-danger-bg' : 'border-line'
                  } text-ink rounded-xl h-12 px-3.5 pr-14 text-amount-pair font-bold tnum placeholder:text-muted placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-brand-600 transition-colors`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted uppercase tracking-wide pointer-events-none">
                {toCurrency?.code ?? 'Forex'}
              </span>
            </div>
            {sendAmountError && <ErrorMsg message={sendAmountError} />}
          </div>

          {/* Equals separator */}
          <div className="hidden md:flex items-center justify-center text-muted font-bold text-amount-pair h-12 mt-[30px] select-none shrink-0 px-1">
            =
          </div>

          {/* Column 3: Amount in FJD */}
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-1.5 text-label font-semibold text-ink">
              <Wallet size={14} className="text-[#E00000] shrink-0" />
              <span>
                {exchangeType === 'SELL'
                  ? `MH Receives (${FJD.code})`
                  : `MH Pays (${FJD.code})`}
              </span>
            </label>

            <div className="relative">
              <div className="w-full min-w-0 box-border rounded-xl h-12 px-3.5 flex items-center justify-between gap-2 text-amount-pair font-bold tnum border border-gray-200 bg-gray-50/50 text-ink">
                {ratesLoading ? (
                  <span className="text-body font-normal text-muted animate-pulse">Loading…</span>
                ) : exchangePreview ? (
                  <span className="font-bold text-ink text-amount-pair tnum">{FJD.symbol}{exchangePreview.formatted}</span>
                ) : (
                  <span className="text-muted text-body font-normal">—</span>
                )}
                <span className="text-caption font-semibold text-muted uppercase tracking-wide">
                  {FJD.code}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
