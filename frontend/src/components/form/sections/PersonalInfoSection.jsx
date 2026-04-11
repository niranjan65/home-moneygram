import React from "react";

import { UserPlus } from "lucide-react";
import { FormField } from "../FormField";
import { personalFields } from "../../../config/personalFields";

export const PersonalInfoSection = () => {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
        <UserPlus size={15} className="text-[#E00000]" />
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Customer Name
          </p>
          <p className="text-xs text-gray-400">
            Enter the customer's legal name as on ID
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {personalFields.map((field) => (
          <FormField key={field.name} {...field} />
        ))}
      </div>
    </div>
  );
};