import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { User, Calendar, FileText, ChevronDown, Upload, CheckCircle2, X } from 'lucide-react';
import { FieldLabel, fieldCls, ErrorMsg } from '../ui/FormUtilities';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useCustomer } from '../../hooks/useCustomer';
import { useAppConfiguration } from '../../../../hooks/useAppConfiguration';

export const DealerPersonalInfoSection = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const { previewUrl, previewFile, fetchAndFillCustomer, removeFile, handleFile } = useCustomer();
  const { potOptions, loading: potLoading, error: potError } = useAppConfiguration();
  const [dragOver, setDragOver] = useState(false);

  // Watch for changes in separate name fields to auto-populate Full Name if desired
  const firstName = watch('firstName');
  const middleName = watch('middleName');
  const lastName = watch('lastName');

  register('docFile', {
    required: 'Passport photo / scan is required',
    validate: (v) => {
      if (!v) return 'Passport photo / scan is required';
      return true;
    },
  });

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

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

        {/* Mandatory Passport Photo / Scan Field */}
        <div id="field-docFile" className="md:col-span-2">
          <FieldLabel required icon={Upload}>
            Passport Photo / Scan
          </FieldLabel>
          <div className="mt-1">
            {previewUrl ? (
              <div className={`rounded-lg border overflow-hidden ${errors.docFile ? 'border-[#E00000]/30' : 'border-gray-200'}`}>
                {previewFile?.type === 'application/pdf' ? (
                  <div className="flex items-center gap-3 px-4 py-3 bg-white">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#E00000]/5">
                      <FileText size={16} className="text-[#E00000]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{previewFile.name}</p>
                      <p className="text-xs text-gray-400">{(previewFile.size / 1024).toFixed(1)} KB · PDF</p>
                    </div>
                    <button type="button" onClick={removeFile}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#E00000] hover:bg-[#E00000]/5 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <img src={previewUrl} alt="Passport" className="w-full max-h-48 object-contain p-3 bg-gray-50" />
                    <button type="button" onClick={removeFile}
                      className="absolute top-2 right-2 w-7 h-7 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-400 hover:text-[#E00000] transition-colors">
                      <X size={13} />
                    </button>
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-green-50 border-t border-green-100 text-xs font-medium text-green-700">
                      <CheckCircle2 size={11} strokeWidth={2.5} /> Document uploaded
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center gap-3 py-8 px-5 rounded-lg border-2 border-dashed cursor-pointer transition-all ${dragOver
                  ? 'border-[#E00000] bg-[#E00000]/5'
                  : errors.docFile
                    ? 'border-[#E00000]/30 bg-[#E00000]/5'
                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden" onChange={e => handleFile(e.target.files[0])} />
                <Upload size={20} className={dragOver ? 'text-[#E00000]' : errors.docFile ? 'text-[#E00000]' : 'text-gray-300'} strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Drop here or <span className="text-[#E00000] underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP or PDF · Max 10 MB</p>
                </div>
              </label>
            )}
          </div>
          <ErrorMsg message={errors.docFile?.message} />
        </div>

      </div>
    </div>
  );
};

