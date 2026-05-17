import React, { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { User, Calendar, FileText, ChevronDown } from 'lucide-react';
import { FieldLabel, fieldCls, ErrorMsg } from '../ui/FormUtilities';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useCustomer } from '../../hooks/useCustomer';
import { useAppConfiguration } from '../../../../hooks/useAppConfiguration';

export const DealerPersonalInfoSection = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const { fetchAndFillCustomer, loading } = useCustomer();
  const { potOptions, loading: potLoading, error: potError } = useAppConfiguration();

  // Watch for changes in separate name fields to auto-populate Full Name if desired
  const firstName = watch('firstName');
  const middleName = watch('middleName');
  const lastName = watch('lastName');


  const triggerFetchIfReady = (name, dob) => {
    if (!name || !dob) return;

    // Format date to YYYY-MM-DD
    const d = new Date(dob);
    const formattedDob = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Search using the combined key
    fetchAndFillCustomer(`${name}_${formattedDob}`);
  };

  // Auto-populate full name as a convenience (optional based on user typing)
  useEffect(() => {
    const parts = [firstName, middleName, lastName].filter(Boolean);
    if (parts.length > 0) {
      // Intentionally not overwriting if user manually cleared full name,
      // but syncing generally helps. We'll set shouldValidate to false so it doesn't overly trigger.
      setValue('fullName', parts.join(' '), { shouldValidate: true });
    }
  }, [firstName, middleName, lastName, setValue]);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
        <User size={16} className="text-[#E00000] flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Personal Information</p>
          <p className="text-xs text-gray-400">Please provide the dealer's personal details</p>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div id="field-firstName">
          <FieldLabel required icon={User}>First Name</FieldLabel>
          <input type="text" placeholder="First Name"
            {...register('firstName', {
              required: 'First Name is required',
              minLength: { value: 2, message: 'Name is too short' }
            })}
            className={`${fieldCls(errors.firstName)} mt-1`} />
          <ErrorMsg message={errors.firstName?.message} />
        </div>

        <div id="field-middleName">
          <FieldLabel icon={User}>Middle Name</FieldLabel>
          <input type="text" placeholder="Middle Name (Optional)"
            {...register('middleName')}
            className={`${fieldCls(errors.middleName)} mt-1 border-gray-200`} />
          <ErrorMsg message={errors.middleName?.message} />
        </div>

        <div id="field-lastName">
          <FieldLabel required icon={User}>Last Name</FieldLabel>
          <input type="text" placeholder="Last Name"
            {...register('lastName', {
              required: 'Last Name is required',
              minLength: { value: 2, message: 'Name is too short' }
            })}
            className={`${fieldCls(errors.lastName)} mt-1`} />
          <ErrorMsg message={errors.lastName?.message} />
        </div>

        <div id="field-fullName" className="md:col-span-2">
          <FieldLabel required icon={FileText}>Full Name</FieldLabel>
          <input type="text" placeholder="Enter full name"
            {...register('fullName', {
              required: 'Full Name is required',
              onBlur: (e) => triggerFetchIfReady(e.target.value, watch('dateOfBirth')),
              minLength: { value: 3, message: 'Name is too short' }
            })}
            className={`${fieldCls(errors.fullName)} mt-1`} />
          <ErrorMsg message={errors.fullName?.message} />
        </div>

        <div id="field-dateOfBirth">
          <FieldLabel required icon={Calendar}>Date of Birth</FieldLabel>
          <Controller
            name="dateOfBirth"
            rules={{
              required: 'Date of birth is required',
              validate: (v) => {
                if (!v) return 'Date of birth is required';
                const today = new Date();
                const dob = new Date(v);
                if (dob >= today) return 'Date of birth must be in the past';
                const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                if (dob > minAge) return 'You must be at least 18 years old';
                return true;
              },
            }}
            render={({ field }) => (
              <div className="dob-picker-wrapper mt-1">
                <DatePicker
                  selected={field.value}
                  onChange={(date) => {
                    field.onChange(date);
                    triggerFetchIfReady(watch('fullName'), date);
                  }}
                  onBlur={field.onBlur}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="YYYY-MM-DD"
                  maxDate={new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate())}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  yearDropdownItemNumber={100}
                  scrollableYearDropdown
                  className={fieldCls(errors.dateOfBirth)}
                  wrapperClassName="block w-full"
                  autoComplete="off"
                />
              </div>
            )}
          />
          <ErrorMsg message={errors.dateOfBirth?.message} />
        </div>

        <div id="field-oetCode" className="md:col-span-2">
          <FieldLabel required icon={FileText}>OET Code</FieldLabel>
          {potError ? (
            <p className="text-[#E00000] text-sm font-medium mt-1">Failed to load OET codes</p>
          ) : potLoading ? (
            <div className="h-12 rounded-lg animate-pulse bg-gray-100 mt-1" />
          ) : (
            <div className="relative mt-1">
              <select
                {...register('oet_code', { required: 'OET Code is required' })}
                className={`${fieldCls(errors.oet_code)} appearance-none pr-10`}
                defaultValue="18"
              >
                <option value="" disabled>Select OET Code</option>
                {potOptions.map(pot => (
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

      </div>
    </div>
  );
};
