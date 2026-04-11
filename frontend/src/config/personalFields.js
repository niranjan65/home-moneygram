export const personalFields = [
  {
    name: "firstName",
    label: "First Name",
    placeholder: "e.g. Maria",
    rules: {
      required: "First name is required",
      minLength: { value: 2, message: "Too short" },
    },
  },
  {
    name: "lastName",
    label: "Last Name",
    placeholder: "e.g. Garcia",
    rules: {
      required: "Last name is required",
      minLength: { value: 2, message: "Too short" },
    },
  },
];