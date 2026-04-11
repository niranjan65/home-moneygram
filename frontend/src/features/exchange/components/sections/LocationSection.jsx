import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Globe, ChevronDown } from 'lucide-react';
import { FieldLabel, fieldCls, ErrorMsg } from '../ui/FormUtilities';
import { locationFields } from '../../config/formFields';
import { useCountries } from '../../../../hooks/useCountry';
// import { useCountries } from '../../../../../hooks/useCountry'; 

export const LocationSection = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const { countries, loading: countryLoading, error: countryError } = useCountries();
  const countryValue = watch('country') ?? '';

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
        <Globe size={15} className="text-[#E00000]" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Location</p>
          <p className="text-xs text-gray-400">Customer's country and city of residence</p>
        </div>
      </div>
      <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel required icon={Globe}>Country</FieldLabel>
          {/* hidden input keeps RHF validation wired up */}
          <input type="hidden" {...register('country', { required: 'Please select a country' })} />
          {countryError ? (
            <p className="text-[#E00000] text-sm font-medium mt-1">Failed to load countries</p>
          ) : countryLoading ? (
            <div className="h-12 rounded-lg animate-pulse bg-gray-100 mt-1" />
          ) : (
            <div className="relative mt-1">
              <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={countryValue}
                onChange={e => setValue('country', e.target.value, { shouldValidate: true })}
                className={`${fieldCls(errors.country)} appearance-none pl-9 pr-9`}>
                {/* <option value="" disabled>Select Country</option> */}
                <option value="">Select Country</option>
                {countries?.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
          <ErrorMsg message={errors.country?.message} />
        </div>

        {locationFields.map(({ name, label, placeholder, rules }) => (
          <div key={name}>
            <FieldLabel required>{label}</FieldLabel>
            <input
              type="text"
              placeholder={placeholder}
              {...register(name, rules)}
              className={`${fieldCls(errors[name])} mt-1`}
            />
            <ErrorMsg message={errors[name]?.message} />
          </div>
        ))}
      </div>
    </div>
  );
};
