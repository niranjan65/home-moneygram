import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  ArrowLeftRight,
  CheckCircle2,
  TrendingUp,
  Coins,
  AlertCircle,
  ChevronDown,
  Wallet,
  FileText,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react';
import { ErrorMsg, FieldLabel, fieldCls, selectCls } from '../ui/FormUtilities';
import { useAppConfiguration } from '../../../../hooks/useAppConfiguration';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';
import ComboBox from '../../../../components/common/ComboBox';

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
  const { potOptions, loading: potLoading, error: potError } = useAppConfiguration();
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
      {/* Transaction Type Card */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-start gap-2.5 mb-4">
          <ArrowLeftRight size={16} className="text-[#E00000] mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-snug">Transaction Type</h3>
            <p className="text-xs text-gray-400 mt-0.5">Choose whether you are buying or selling foreign currency</p>
          </div>
        </div>

        <input type="hidden" {...register('exchangeType', { required: 'Please select an Exchange type' })} />

        <div className="grid grid-cols-2 gap-4 mt-2">
          {exchangeTypes.map(({ key, label, Icon }) => {
            const active = exchangeType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setValue('exchangeType', key, { shouldValidate: true })}
                className={`relative py-5 px-4 rounded-2xl border-2 text-sm transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer ${active
                    ? 'border-[#E00000] bg-white text-[#B70000] shadow-2xs'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
              >
                {active && (
                  <CheckCircle2
                    size={16}
                    className="absolute top-3 right-3 text-[#B70000]"
                    strokeWidth={2}
                  />
                )}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${active ? 'bg-[#E00000] text-white shadow-xs' : 'bg-gray-100 text-gray-400'
                    }`}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <span
                  className={
                    active
                      ? 'font-bold text-sm text-[#B70000]'
                      : 'font-medium text-sm text-gray-500'
                  }
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        <ErrorMsg message={errors.exchangeType?.message} />
      </div>

      {/* Currency & Amount Card */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-start gap-2.5 mb-4">
          <Coins size={16} className="text-[#E00000] mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-snug">Currency & Amount</h3>
            <p className="text-xs text-gray-400 mt-0.5">Enter the transaction amount and select currency</p>
          </div>
        </div>

        {/* Rate Banner */}
        {toCurrency && currentRateDisplay && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/70 border border-gray-100 rounded-xl mb-4.5">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-[#E00000] shrink-0" />
              <span className="text-caption text-gray-500 font-normal">Rate:</span>
              <span className="text-caption font-bold tnum text-gray-900">
                1 {FJD.symbol} = {Number(currentRateDisplay).toFixed(4)} {toCurrency.code}
              </span>
            </div>
            <span className="text-overline font-semibold text-[#E00000] bg-red-50 border border-red-200/80 px-2 py-0.5 rounded tracking-wider uppercase">
              {exchangeType === 'BUY' ? 'BUY RATE' : 'SELL RATE'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_1fr] items-start gap-3 sm:gap-4">
          {/* Column 1: Currency Selector */}
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <Coins size={13} className="text-[#E00000] shrink-0" />
              <span>Currency</span>
              <span className="text-[#E00000] font-bold">*</span>
            </label>

            {rateError ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#E00000]/5 border border-[#E00000]/20 rounded-lg text-red-600 text-xs">
                <AlertCircle size={12} />
                {rateError}
              </div>
            ) : ratesLoading ? (
              <div className="h-11 rounded-xl animate-pulse bg-gray-100" />
            ) : availableCurrencies?.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                <AlertCircle size={12} />
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
                      <span className={`font-bold text-sm ${isHighlighted ? 'text-[#E00000]' : 'text-gray-900'}`}>
                        {c.code}
                      </span>
                      {c.country && (
                        <span className="text-caption text-gray-400 truncate max-w-[130px]">
                          {c.country}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono">
                      {exchangeType === 'BUY'
                        ? `Buy: ${Number(c.buyingRate).toFixed(4) ?? '—'}`
                        : `Sell: ${Number(c.sellingRate).toFixed(4) ?? '—'}`}
                    </span>
                  </div>
                )}
                className={`w-full min-w-0 box-border bg-white border-2 ${
                  toCurrency ? 'border-[#E00000]' : 'border-gray-200'
                } text-gray-900 rounded-xl h-11 px-3.5 pr-14 text-sm font-semibold focus:outline-none transition-colors cursor-pointer`}
              />
            )}
          </div>

          {/* Column 2: Amount (Forex) */}
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <Coins size={13} className="text-[#E00000] shrink-0" />
              <span>
                {exchangeType === 'SELL'
                  ? `MH Pays (${toCurrency?.code ?? 'Forex'})`
                  : `MH Receives (${toCurrency?.code ?? 'Forex'})`}
              </span>
              <span className="text-[#E00000] font-bold">*</span>
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
                placeholder="Enter Forex amount"
                className={`w-full min-w-0 box-border bg-white border ${sendAmountError ? 'border-[#E00000]/40 bg-red-50/20' : 'border-gray-200'
                  } text-gray-900 rounded-xl h-11 px-3.5 pr-14 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:border-red-500 transition-colors`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 uppercase tracking-wide pointer-events-none">
                {toCurrency?.code ?? 'Forex'}
              </span>
            </div>
            {sendAmountError && <ErrorMsg message={sendAmountError} />}
          </div>

          {/* Equals separator */}
          <div className="hidden md:flex items-center justify-center text-gray-400 font-bold text-lg h-11 mt-[26px] select-none shrink-0 px-1">
            =
          </div>

          {/* Column 3: Local Currency (FJD) */}
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <Wallet size={13} className="text-[#E00000] shrink-0" />
              <span>
                {exchangeType === 'SELL'
                  ? `MH Receives (${FJD.code})`
                  : `MH Pays (${FJD.code})`}
              </span>
            </label>

            <div className="relative">
              <div className="w-full min-w-0 box-border rounded-xl h-11 px-3.5 pr-14 flex items-center justify-between text-sm font-semibold border border-gray-200 bg-gray-50/50 text-gray-800">
                {ratesLoading ? (
                  <span className="text-sm font-normal text-gray-400 animate-pulse">Loading…</span>
                ) : exchangePreview ? (
                  <span className="font-bold text-gray-900 text-sm">{FJD.symbol}{exchangePreview.formatted}</span>
                ) : (
                  <span className="text-gray-400 text-sm font-normal">—</span>
                )}
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {FJD.code}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction & Regulatory Details Card */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-start gap-2.5 mb-4">
          <FileText size={16} className="text-[#E00000] mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-snug">Regulatory &amp; Transaction Details</h3>
            <p className="text-xs text-gray-400 mt-0.5">OET code classification, risk assessment, and remarks</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Row 1: OET Code & Risk Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div id="field-oetCode">
              <FieldLabel required icon={FileText}>OET Code</FieldLabel>
              {potError ? (
                <p className="text-[#E00000] text-sm font-medium mt-1">Failed to load OET codes</p>
              ) : potLoading ? (
                <div className="h-12 rounded-lg animate-pulse bg-gray-100 mt-1" />
              ) : (
                <div className="relative mt-1">
                  <select
                    {...register('oet_code', { required: 'OET Code is required' })}
                    className={selectCls(errors.oet_code)}
                    defaultValue="18"
                  >
                    <option value="" disabled>Select OET Code</option>
                    {potOptions?.map(pot => (
                      <option key={pot.code} value={pot.code}>{pot.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              )}
              <ErrorMsg message={errors.oet_code?.message} />
            </div>

            <div id="field-riskLevel">
              <FieldLabel required icon={ShieldAlert}>Risk Level</FieldLabel>
              <div className="relative mt-1">
                <select
                  {...register('risk_level', { required: 'Risk Level is required' })}
                  className={selectCls(errors.risk_level)}
                  defaultValue="Low"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                  <ChevronDown size={16} />
                </div>
              </div>
              <ErrorMsg message={errors.risk_level?.message} />
            </div>
          </div>

          {/* Row 2: Full width small textarea for Remarks */}
          <div id="field-remarks" className="w-full">
            <FieldLabel icon={MessageSquare}>Remarks</FieldLabel>
            <div className="relative mt-1">
              <textarea
                rows={2}
                placeholder="Enter remarks..."
                {...register('remarks')}
                className={`${fieldCls(errors.remarks)} resize-y min-h-[52px]`}
              />
            </div>
            <ErrorMsg message={errors.remarks?.message} />
          </div>
        </div>
      </div>
    </div>
  );
};
