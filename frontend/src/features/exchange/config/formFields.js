export const personalInfoFields = [
  {
    name: "firstName",
    label: "First/Given Name",
    placeholder: "e.g. Maria",
    rules: { required: 'First name is required', minLength: { value: 2, message: 'Too short' } },
  },
  {
    name: "middleName",
    label: "Middle Name",
    placeholder: "optional",
    rules: { minLength: { value: 2, message: 'Too short' } },
  },
  
  {
    name: "lastName",
    label: "Last/Family Name",
    placeholder: "e.g. Garcia",
    rules: { required: 'Last name is required', minLength: { value: 2, message: 'Too short' } },
  },
  {
    name: "secondLastName",
    label: "Second Last/Family Name",
    placeholder: "optional",
    rules: { minLength: { value: 2, message: 'Too short' } },
  },
  {
    name: "purposeOfTransaction",
    label: "Purpose of Transaction",
    placeholder: "eg: Gift, Travel, Education, Medical",
    rules: { minLength: { value: 2, message: 'Too short' } },
  },
   
];

export const locationFields = [
  {
    name: "city",
    label: "City / Province",
    placeholder: "e.g. Madrid",
    rules: { required: 'City is required' },
  }
];
