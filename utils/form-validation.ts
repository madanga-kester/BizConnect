import { isValidKenyanPhone } from "@/utils/kenya";

export interface RegistrationInput {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  interests: string[];
}
export const MAX_INTERESTS = 5;
export type RegistrationField = keyof RegistrationInput;
export type ValidationErrors = Partial<Record<RegistrationField | "emailOrUsername", string>>;

export interface ValidationResult {
  valid: boolean;
  errors: ValidationErrors;
}

export function isValidEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

export function validateRegistration(input: RegistrationInput): ValidationResult {
  const errors: ValidationErrors = {};
  const username = input.username.trim().replace(/^@/, "");
  if (input.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username)) errors.username = "Use 3–30 letters, numbers, dots or underscores.";
  if (!isValidEmail(input.email)) errors.email = "Enter a valid email address.";
  if (!isValidKenyanPhone(input.phone)) errors.phone = "Enter a valid Kenyan phone number.";
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/.test(input.password)) errors.password = "Use at least 12 characters with an uppercase letter, a lowercase letter, a number and a special character.";
  if (input.confirmPassword !== input.password) errors.confirmPassword = "Passwords do not match.";
  if (input.interests.length === 0) errors.interests = "Choose at least one interest.";
  else if (input.interests.length > MAX_INTERESTS) errors.interests = `Choose no more than ${MAX_INTERESTS} interests.`;
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateLogin(emailOrUsername: string, password: string): ValidationResult {
  const errors: ValidationErrors = {};
  if (!emailOrUsername.trim()) errors.emailOrUsername = "Enter your email address or username.";
  if (password.length < 6) errors.password = "Enter a password with at least 6 characters.";
  return { valid: Object.keys(errors).length === 0, errors };
}

/** The local onboarding code is a UI-only demo check; it does not represent an SMS or identity verification. */
export function validateDemoOtp(value: string): ValidationResult {
  const errors: ValidationErrors = {};
  if (!/^\d{6}$/.test(value)) errors.password = "Enter a six-digit code.";
  else if (value !== "123456") errors.password = "For this local demo, enter 123456. No SMS was sent.";
  return { valid: Object.keys(errors).length === 0, errors };
}
