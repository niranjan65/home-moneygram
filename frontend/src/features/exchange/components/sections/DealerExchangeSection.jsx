import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ArrowLeftRight, TrendingUp, Coins, AlertCircle, ChevronDown, Wallet } from 'lucide-react';
import { FieldLabel, ErrorMsg, inputBase } from '../ui/FormUtilities';

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
    <>
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white mt-5">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <ArrowLeftRight size={15} className="text-[#E00000]" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Transaction Type</p>
            <p className="text-xs text-gray-400">Choose whether you are buying or selling foreign currency</p>
          </div>
        </div>
        <div className="px-5 py-5">
          <input type="hidden" {...register('exchangeType', { required: 'Please select an Exchange type' })} />
          <div className="grid grid-cols-2 gap-3">
            <button type="button"
              onClick={() => setValue('exchangeType', 'BUY', { shouldValidate: true })}
              className={`relative py-4 px-4 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                activeBuy ? 'border-[#E00000] bg-[#E00000]/5 text-[#B70000]' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
              }`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeBuy ? 'bg-[#E00000] text-white' : 'bg-gray-100 text-gray-400'}`}>
                <TrendingUp size={17} strokeWidth={1.75} />
              </div>
              <span className={activeBuy ? 'text-[#B70000] font-semibold' : 'text-gray-400'}>Buy Forex</span>
            </button>
            <button type="button"
              onClick={() => setValue('exchangeType', 'SELL', { shouldValidate: true })}
              className={`relative py-4 px-4 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                activeSell ? 'border-[#E00000] bg-[#E00000]/5 text-[#B70000]' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
              }`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeSell ? 'bg-[#E00000] text-white' : 'bg-gray-100 text-gray-400'}`}>
                <ArrowLeftRight size={17} strokeWidth={1.75} />
              </div>
              <span className={activeSell ? 'text-[#B70000] font-semibold' : 'text-gray-400'}>Sell Forex</span>
            </button>
          </div>
          <ErrorMsg message={errors.exchangeType?.message} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white mt-5">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <Coins size={15} className="text-[#E00000]" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Currency & Amount</p>
            <p className="text-xs text-gray-400">Select currency and manually input the agreed rate</p>
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex flex-col gap-2">
              <FieldLabel required icon={Coins}>
                Select Currency
              </FieldLabel>
              {rateError ? (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-[#E00000]/5 border border-[#E00000]/20 rounded-lg text-red-600 text-xs">
                  <AlertCircle size={12} />{rateError}
                </div>
              ) : ratesLoading ? (
                <div className="h-12 rounded-lg animate-pulse bg-gray-100" />
              ) : (
                <div className="relative">
                  <select
                    className={`${inputBase} appearance-none pr-9`}
                    value={toCurrency?.code ?? ''}
                    onChange={e => {
                      const found = availableCurrencies?.find(c => c.code === e.target.value);
                      setToCurrency(found ?? null);
                    }}>
                    <option value="" disabled>— Select Currency —</option>
                    {availableCurrencies?.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name || 'Currency'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <FieldLabel required icon={TrendingUp}>
                Exchange Rate
              </FieldLabel>
              <div className="relative">
                <input type="number" min="0" step="any" value={manualRate}
                  onChange={e => setManualRate(e.target.value)}
                  placeholder="Enter rate"
                  className={`${inputBase} text-base font-medium`} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <FieldLabel required icon={Coins}>
                {exchangeType === 'SELL' ? `MH Pays (${toCurrency?.code ?? 'Forex'})` : `MH Receives (${toCurrency?.code ?? 'Forex'})`}
              </FieldLabel>
              <div className="relative mt-1">
                <input type="number" min="0" step="any" value={sendAmount}
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setSendAmount('');
                      setSendAmountError('');
                    } else {
                      const val = parseFloat(raw);
                      setSendAmount(isNaN(val) ? '' : val);
                      setSendAmountError(val > 0 ? '' : 'Please enter a valid amount');
                    }
                  }}
                  onBlur={() => {
                    if (sendAmount > 0) onAmountBlur?.();
                  }}
                  placeholder="Enter Forex amount"
                  className={`${inputBase} text-lg font-semibold pr-16 ${sendAmountError ? 'border-[#E00000]/30 bg-[#E00000]/5' : ''}`} />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-gray-400">
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
                <div className={`w-full h-12 mt-1 rounded-lg flex items-center px-4 pr-16 text-lg font-semibold border transition-colors ${
                  exchangePreview ? 'bg-[#E00000]/5 border-[#E00000]/20 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}>
                  {ratesLoading ? (
                    <span className="text-sm font-normal text-gray-400 animate-pulse">Loading…</span>
                  ) : exchangePreview ? (
                    <span>{FJD.symbol}{exchangePreview.formatted}</span>
                  ) : (
                    <span className="text-gray-300 text-sm font-normal">—</span>
                  )}
                </div>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-gray-400 mt-1">
                  {FJD.code}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
