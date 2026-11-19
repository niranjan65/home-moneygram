import React from "react";

const FormInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  className = "",
}) => {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="text-label font-semibold text-ink block">
          {label}
        </label>
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full border rounded-2xl px-5 py-4 text-body font-medium tnum
          focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
          transition-all
          ${error ? "border-red-500" : "border-gray-200"}
          ${disabled ? "bg-gray-50 cursor-not-allowed" : ""}
          ${className}
        `}
      />

      {error && (
        <p className="text-label text-danger font-normal">{error}</p>
      )}
    </div>
  );
};

export default FormInput;