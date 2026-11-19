import React from "react";
import { useFormContext } from "react-hook-form";
import { AlertCircle } from "lucide-react";

const inputBase =
  "w-full rounded-input border border-line-strong bg-surface h-12 px-3.5 text-body font-medium text-ink " +
  "focus:outline-none placeholder:text-muted placeholder:font-normal transition-colors " +
  "focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600";

export const FormField = ({ name, label, placeholder, rules }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div>
      <label className="text-label font-semibold text-ink mb-1.5 block">
        {label} <span className="text-danger">*</span>
      </label>

      <input
        {...register(name, rules)}
        placeholder={placeholder}
        className={`${inputBase} ${
          error
            ? "border-danger/40 bg-brand-50/20"
            : ""
        }`}
      />

      {error && (
        <p className="flex items-center gap-1 text-danger text-label mt-1 font-normal">
          <AlertCircle size={14} /> {error.message}
        </p>
      )}
    </div>
  );
};