import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ArrowLeftRight, TrendingUp, Coins, AlertCircle, ChevronDown, Wallet, CheckCircle2 } from 'lucide-react';
import { FieldLabel, ErrorMsg, inputBase } from '../ui/FormUtilities';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';
import ComboBox from '../../../../components/common/ComboBox';

export const DealerExchangeSection = ({
  exchangeType,
  availableCurrencies,
  ratesLoading,
  rateError,
  toCurrency,
  setToCurrency,
  manualRate,
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

  const activeBuy = exchangeType === 'BUY';
  const activeSell = exchangeType === 'SELL';

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" {...register('exchangeType', { required: 'Please select an Exchange type' })} />

      {/* Agreed Dealer Rate Banner */}
      {effectiveRate && toCurrency && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-alt border border-line rounded-xl">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-brand-600 shrink-0" />
            <span className="text-xs text-muted font-normal">Agreed Dealer Rate:</span>
            <span className="text-xs font-bold text-ink tnum">
              1 {FJD.symbol} = {Number(effectiveRate).toFixed(4)} {toCurrency.code}
            </span>
          </div>
          <span className="text-[10px] font-bold text-brand-600 bg-danger-bg border border-danger-border px-2 py-0.5 rounded tracking-wide uppercase">
            {exchangeType === 'BUY' ? 'Dealer Buy Rate' : 'Dealer Sell Rate'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 items-center">

        <div id="field-toCurrency" className="flex flex-col gap-2">
          <FieldLabel required icon={Coins}>
            Select Currency
          </FieldLabel>
          {rateError ? (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-danger-bg border border-danger-border rounded-lg text-brand-600 text-xs">
              <AlertCircle size={12} />{rateError}
            </div>
          ) : ratesLoading ? (
            <div className="h-12 rounded-lg animate-pulse bg-chip" />
          ) : (
            <ComboBox
              options={availableCurrencies || []}
              value={toCurrency?.code}
              onChange={(found) => setToCurrency(found ?? null)}
              placeholder="— Search or select currency —"
              getOptionLabel={(c) => `${c.code} — ${c.name || 'Currency'}`}
              getOptionValue={(c) => c.code}
              renderOption={(c, isSelected, isHighlighted) => (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isHighlighted ? 'text-brand-600' : 'text-ink'}`}>
                      {c.code}
                    </span>
                    {(c.name || c.country) && (
                      <span className="text-caption text-muted truncate max-w-[130px]">
                        {c.name || c.country}
                      </span>
                    )}
                  </div>
                </div>
              )}
              className={`w-full min-w-0 box-border bg-surface border ${toCurrency ? 'border-brand-600' : 'border-line'
                } text-ink rounded-lg h-12 px-3.5 pr-14 text-sm font-semibold focus:outline-none transition-colors cursor-pointer`}
            />
          )}
        </div>

        <div id="field-manualRate" className="flex flex-col gap-2">
          <FieldLabel required icon={TrendingUp}>
            Exchange Rate
          </FieldLabel>
          <div className="relative">
            <CurrencyInput
              value={manualRate}
              onChange={e => setManualRate(e.target.value)}
              placeholder="Enter rate"
              className={`${inputBase} text-base font-medium`}
            />
          </div>
        </div>

        <div id="field-sendAmount" className="flex flex-col gap-2">
          <FieldLabel required icon={Coins}>
            {exchangeType === 'SELL' ? `MH Pays (${toCurrency?.code ?? 'Forex'})` : `MH Receives (${toCurrency?.code ?? 'Forex'})`}
          </FieldLabel>
          <div className="relative mt-1">
            <CurrencyInput
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
              placeholder="Enter Forex amount"
              className={`${inputBase} text-lg font-semibold pr-16 ${sendAmountError ? 'border-danger-border bg-danger-bg' : ''}`}
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-muted">
              {toCurrency?.code ?? '---'}
            </span>
          </div>
          {sendAmountError && <ErrorMsg message={sendAmountError} />}
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel icon={Wallet}>
            {exchangeType === 'SELL' ? `MH Receives (${FJD.code})` : `MH Pays (${FJD.code})`}
          </FieldLabel>
          <div className="relative">
            <div className={`w-full h-12 mt-1 rounded-lg flex items-center px-4 pr-16 text-lg font-semibold border transition-colors ${exchangePreview ? 'bg-danger-bg border-danger-border text-brand-600' : 'bg-surface-alt border-line text-muted'
              }`}>
              {ratesLoading ? (
                <span className="text-sm font-normal text-muted animate-pulse">Loading…</span>
              ) : exchangePreview ? (
                <span>{FJD.symbol}{exchangePreview.formatted}</span>
              ) : (
                <span className="text-muted text-sm font-normal">—</span>
              )}
            </div>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-muted mt-1">
              {FJD.code}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
