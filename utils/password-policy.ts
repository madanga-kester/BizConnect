export const PASSWORD_RULES = [
  { label: "At least 12 characters", test: (value: string) => value.length >= 12 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
  { label: "One special character", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export const PASSWORD_ERROR =
  "Your password must contain at least 12 characters, including an uppercase letter, a lowercase letter, a number and a special character.";

export const isStrongPassword = (value: string) =>
  PASSWORD_RULES.every((rule) => rule.test(value));