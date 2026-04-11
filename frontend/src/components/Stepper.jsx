
import React from 'react';
import { Check } from 'lucide-react';


let Step = {
  ESTIMATE: 1,
  DETAILS: 2,
  REVIEW: 3,
  PAYMENT: 4
}

export const Stepper = ({ currentStep }) => {
  const steps = [
    { id: Step.ESTIMATE, label: 'Estimate' },
    { id: Step.DETAILS, label: 'Details' },
    { id: Step.REVIEW, label: 'Review' },
    { id: Step.PAYMENT, label: 'Payment' },
  ];

  return (
    // Fixed: changed 'class' to 'className'
    <div className="w-full flex justify-center mb-8">
      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-semibold">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all
                  ${currentStep > step.id ? 'bg-primary/10 border-primary text-primary' :
                    currentStep === step.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' :
                      'border-gray-200  text-gray-400'}
                `}
              >
                {currentStep > step.id ? <Check size={16} strokeWidth={3} /> : step.id}
              </div>
              <span className={`hidden md:inline ${currentStep === step.id ? 'text-gray-900 ' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 w-6 sm:w-12 rounded-full ${currentStep > step.id ? 'bg-primary/30' : 'bg-gray-100 '}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
