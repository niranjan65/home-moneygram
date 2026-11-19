import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ChevronDown, FileText, UserPlus, Globe } from 'lucide-react';
import { FieldLabel, fieldCls, selectCls, ErrorMsg } from '../ui/FormUtilities';
import { personalInfoFields } from '../../config/formFields';
import { locationFields } from '../../config/formFields';
import { useCountries } from '../../../../hooks/useCountry';

export const PersonalInfoSection = ({ onUserDetailEdit }) => {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const { countries, loading: countryLoading, error: countryError } = useCountries();
  const countryValue = watch('country') ?? '';

  const occupations = [
  'Accountant / Auditor',
  'Agriculture / Farming',
  'Business Owner / Entrepreneur',
  'Civil Servant / Government Employee',
  'Construction / Trades Worker',
  'Doctor / Medical Professional',
  'Driver / Transport Worker',
  'Engineer',
  'Fisherman',
  'Hospitality / Tourism',
  'Housewife / Homemaker',
  'IT / Technology',
  'Lawyer / Legal Professional',
  'Military / Police / Security',
  'Mining / Resource Worker',
  'NGO / Non-Profit Worker',
  'Nurse / Healthcare Worker',
  'Pensioner / Retired',
  'Sales / Marketing',
  'Student',
  'Teacher / Educator',
  'Unemployed',
  'Other',
];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personalInfoFields.map(({ name, label, placeholder, rules }) => (
          <div key={name}>
            {
              rules.required 
              ? <FieldLabel required>{label}</FieldLabel>
              : <FieldLabel >{label}</FieldLabel>
            }
            <input 
              type="text" 
              placeholder={placeholder} 
              {...register(name, rules)} 
              className={fieldCls(errors[name])} 
            />
            <ErrorMsg message={errors[name]?.message} />
          </div>
        ))}
        <div>
          <FieldLabel icon={FileText}>Occupation</FieldLabel>
          <div className="relative mt-1">
            <select className={selectCls(errors.occupation)}
              {...register('occupation')}>
              {
                occupations.map((occup, idx) => (
                  <option key={idx}>{occup}</option>
                ))
              }
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* ── Location Fields ───────────────────────────────────────── */}
        <div>
          <FieldLabel required icon={Globe}>Country</FieldLabel>
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
                className={`${selectCls(errors.country)} pl-9 pr-9`}>
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
  );
};
