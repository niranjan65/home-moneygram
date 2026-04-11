import React from "react";
import { useFormContext } from "react-hook-form";
import { AlertCircle } from "lucide-react";

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white h-12 px-4 text-sm text-gray-800 " +
  "focus:outline-none placeholder:text-gray-400 transition-colors " +
  "focus:ring-2 focus:ring-red-100 focus:border-[#E00000]";

export const FormField = ({ name, label, placeholder, rules }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">
        {label} <span className="text-[#E00000]">*</span>
      </label>

      <input
        {...register(name, rules)}
        placeholder={placeholder}
        className={`${inputBase} ${
          error
            ? "border-[#E00000]/30 bg-[#E00000]/5"
            : ""
        }`}
      />

      {error && (
        <p className="flex items-center gap-1 text-[#E00000] text-xs mt-1">
          <AlertCircle size={11} /> {error.message}
        </p>
      )}
    </div>
  );
};