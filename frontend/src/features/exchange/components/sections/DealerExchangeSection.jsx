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
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/70 border border-gray-100 rounded-xl">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-[#E00000] shrink-0" />
            <span className="text-xs text-gray-500 font-normal">Agreed Dealer Rate:</span>
            <span className="text-xs font-bold text-gray-900 tnum">
              1 {FJD.symbol} = {Number(effectiveRate).toFixed(4)} {toCurrency.code}
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#E00000] bg-red-50 border border-red-200/80 px-2 py-0.5 rounded tracking-wide uppercase">
            {exchangeType === 'BUY' ? 'Dealer Buy Rate' : 'Dealer Sell Rate'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div id="field-toCurrency" className="flex flex-col gap-2">
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
                        <span className={`font-bold text-sm ${isHighlighted ? 'text-[#E00000]' : 'text-gray-900'}`}>
                          {c.code}
                        </span>
                        {(c.name || c.country) && (
                          <span className="text-caption text-gray-400 truncate max-w-[130px]">
                            {c.name || c.country}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  className={`w-full min-w-0 box-border bg-white border ${
                    toCurrency ? 'border-[#E00000]' : 'border-gray-200'
                  } text-gray-900 rounded-lg h-12 px-3.5 pr-14 text-sm font-semibold focus:outline-none transition-colors cursor-pointer`}
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
                  className={`${inputBase} text-lg font-semibold pr-16 ${sendAmountError ? 'border-[#E00000]/30 bg-[#E00000]/5' : ''}`}
                />
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
      );
    };
