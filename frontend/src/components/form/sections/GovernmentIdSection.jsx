import React from "react";
import { useFormContext } from "react-hook-form";
import { GOVERNMENT_ID_TYPES } from "../../../config/governmentIdConfig";
import { useCustomerLookup } from "../../../hooks/useCustomerLookup";
import { FileUploadField } from "../FileUploadField";


export const GovernmentIdSection = () => {
  const { register, setValue, watch } = useFormContext();

  const idType = watch("government_id");
  const idNumber = watch("idNumber");

  const { fetchCustomer, loading } = useCustomerLookup(setValue);

  const selected = GOVERNMENT_ID_TYPES.find(
    (t) => t.value === idType
  );

  return (
    <div className="bg-white border rounded-xl p-5 space-y-4">

      {/* ID Type */}
      <div>
        <label className="text-xs text-gray-500">ID Type</label>
        <select {...register("government_id")} className="input mt-1">
          {GOVERNMENT_ID_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* ID Number */}
      <div>
        <label className="text-xs text-gray-500">ID Number *</label>
        <input
          {...register("idNumber", {
            required: "Required",
          })}
          placeholder={selected?.placeholder}
          onBlur={(e) => fetchCustomer(e.target.value)}
          className="input mt-1"
        />
      </div>

      {/* Upload */}
      <FileUploadField
        name="docFile"
        label={
          idType === "PASSPORT"
            ? "Passport Upload"
            : "Government ID Upload"
        }
      />

      {loading && (
        <p className="text-xs text-gray-400">
          Fetching customer...
        </p>
      )}
    </div>
  );
};