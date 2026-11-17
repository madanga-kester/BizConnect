import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Button,
  Chip,
  Field,
  Page,
  TopBar,
  styles,
} from "@/components/biz-ui";

import { useMabizServices } from "@/lib/services/service-provider";
import { COUNTY_TOWNS, KENYAN_COUNTIES } from "@/utils/kenya";
import { MAX_INTERESTS, validateRegistration } from "@/utils/form-validation";
import { colors } from "@/theme/tokens";
import type { County } from "@/types/domain";

const INTERESTS = [
  "Shopping",
  "Entrepreneurship",
  "Fashion",
  "Technology",
  "Food",
  "Beauty",
  "Agriculture",
  "Services",
  "Other business categories",
];

const PASSWORD_RULES = [
  { label: "At least 12 characters", test: (value: string) => value.length >= 12 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
  { label: "One special character", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

const PASSWORD_ERROR =
  "Your password must contain at least 12 characters, including an uppercase letter, a lowercase letter, a number and a special character.";

const isStrongPassword = (value: string) =>
  PASSWORD_RULES.every((rule) => rule.test(value));

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Registration", message);
}

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
};

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  visible,
  onToggle,
}: PasswordFieldProps) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={{
          minHeight: 54,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#DCE5DF",
          borderRadius: 13,
          backgroundColor: colors.white,
          paddingLeft: 15,
          paddingRight: 6,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#87938C"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          accessibilityLabel={label}
          style={{
            flex: 1,
            height: 52,
            color: colors.navy,
            fontSize: 14,
          }}
        />

        <Pressable
          onPress={onToggle}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          style={{
            height: 44,
            width: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={21}
            color="#718078"
          />
        </Pressable>
      </View>
    </View>
  );
}
type Step = 1 | 2 | 3 | 4;

const STEP_META: Record<Step, { eyebrow: string; title: string; subtitle: string }> = {
  1: {
    eyebrow: "STEP 1 OF 4 - PERSONAL DETAILS",
    title: "Let's get you started.",
    subtitle:
      "Create your profile, discover businesses and connect with opportunities around you.",
  },
  2: {
    eyebrow: "STEP 2 OF 4 - LOCATION",
    title: "Where are you based?",
    subtitle: "Select your county and town to discover nearby opportunities.",
  },
  3: {
    eyebrow: "STEP 3 OF 4 - SECURITY",
    title: "Secure your account.",
    subtitle: "Create a strong password to protect your account.",
  },
  4: {
    eyebrow: "STEP 4 OF 4 - INTERESTS",
    title: "What interests you?",
    subtitle: "Choose from the categories below or add your own.",
  },
};

type RegisterFieldKey = "username" | "email" | "phone";
type FieldErrors = Partial<Record<RegisterFieldKey, string>>;

const REGISTER_API_ERRORS: Record<
  string,
  { step: Step; field: RegisterFieldKey; message: string }
> = {
  USERNAME_TAKEN: {
    step: 1,
    field: "username",
    message: "That username is already taken. Choose a different one.",
  },
  EMAIL_TAKEN: {
    step: 1,
    field: "email",
    message:
      "An account with this email address already exists. Sign in, or use a different email.",
  },
  PHONE_TAKEN: {
    step: 1,
    field: "phone",
    message:
      "An account with this phone number already exists. Sign in, or use a different number.",
  },
  INVALID_PHONE: {
    step: 1,
    field: "phone",
    message: "Enter a valid phone number, for example +254 712 345 678.",
  },
  CONTACT_REQUIRED: {
    step: 1,
    field: "email",
    message: "Enter an email address or a phone number.",
  },
};

function registerFallbackMessage(error: { code: string; message: string }) {
  if (error.code === "NETWORK_ERROR" || error.code === "REQUEST_TIMEOUT") {
    return "We could not reach Mabiz. Check your internet connection and try again.";
  }
  if (error.code === "RATE_LIMITED") {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (error.code === "SERVER_ERROR") {
    return "Something went wrong on our side. Please try again shortly.";
  }
  return error.message;
}

export default function RegisterScreen() {
  const services = useMabizServices();

  const [step, setStep] = useState<Step>(1);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [county, setCounty] = useState<County>("Nairobi");
  const [town, setTown] = useState("Nairobi");

  const [interests, setInterests] = useState<string[]>([
    "Entrepreneurship",
  ]);
  const [customInterest, setCustomInterest] = useState("");

  const [countyModalVisible, setCountyModalVisible] = useState(false);
  const [countySearch, setCountySearch] = useState("");

  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearFieldError = (key: RegisterFieldKey) =>
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    label: rule.label,
    valid: rule.test(password),
  }));

  const filteredCounties = KENYAN_COUNTIES.filter((item) =>
    item.toLowerCase().includes(countySearch.trim().toLowerCase())
  );

  const selectCounty = (item: string) => {
    const selectedCounty = item as County;

    setCounty(selectedCounty);
    setTown(COUNTY_TOWNS[selectedCounty][0]);
    setCountyModalVisible(false);
    setCountySearch("");
  };

  const closeCountyModal = () => {
    setCountyModalVisible(false);
    setCountySearch("");
  };

  const toggleInterest = (item: string) => {
    if (!interests.includes(item) && interests.length >= MAX_INTERESTS) {
      return feedback(`You can select up to ${MAX_INTERESTS} interests.`);
    }

    setInterests((current) =>
      current.includes(item)
        ? current.filter((interest) => interest !== item)
        : [...current, item]
    );
  };

  const addCustomInterest = () => {
    const value = customInterest.trim().replace(/\s+/g, " ");

    if (!value) return;

    if (value.length > 40) {
      return feedback("An interest cannot exceed 40 characters.");
    }

    const alreadyExists = interests.some(
      (interest) => interest.toLowerCase() === value.toLowerCase()
    );

    if (alreadyExists) {
      return feedback("This interest has already been selected.");
    }

    if (interests.length >= MAX_INTERESTS) {
      return feedback(`You can select up to ${MAX_INTERESTS} interests.`);
    }

    setInterests((current) => [...current, value]);
    setCustomInterest("");
  };

  const goNext = () => {
    if (step === 1) {
      if (!name.trim()) return feedback("Please enter your full name.");
      if (!username.trim()) return feedback("Please choose a username.");
      if (!email.trim() && !phone.trim()) {
        return feedback("Please enter an email address or phone number.");
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!isStrongPassword(password)) {
        return feedback(PASSWORD_ERROR);
      }

      if (password !== confirmPassword) {
        return feedback("Your passwords do not match.");
      }

      setStep(4);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep((current) => (current - 1) as Step);
    } else {
      router.back();
    }
  };

  const register = async () => {
    if (!isStrongPassword(password)) {
      return feedback(PASSWORD_ERROR);
    }

    if (password !== confirmPassword) {
      return feedback("Your passwords do not match.");
    }

    const result = validateRegistration({
      name,
      username,
      email,
      phone,
      password,
      confirmPassword,
      interests,
    });

    if (!result.valid) {
      return feedback(
        Object.values(result.errors)[0] ??
          "Check your registration details and try again."
      );
    }

    if (busy) return;

    setFieldErrors({});
    setBusy(true);

    try {
      const created = await services.auth.register({
        name: name.trim(),
        username: username.replace(/^@/, "").trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        county,
        town,
        interests,
      });

      if (!created.ok) {
        const known = REGISTER_API_ERRORS[created.error.code];
        if (known) {
          const next: FieldErrors = {};
          next[known.field] = known.message;
          setFieldErrors(next);
          setStep(known.step);
          feedback(known.message);
          return;
        }
        feedback(registerFallbackMessage(created.error));
        return;
      }

      const contactEmail = email.trim();

      if (!contactEmail) {
        feedback("Your account has been created. Please sign in.");
        router.replace("/auth/login");
        return;
      }

      const challenge = await services.auth.requestVerificationCode({
        identifier: contactEmail,
        purpose: "registration",
      });

      if (!challenge.ok) {
        feedback(
          "Your account was created, but we could not send a verification code. You can sign in and verify later."
        );
        router.replace("/auth/login");
        return;
      }

      router.replace({
        pathname: "/auth/confirm-email",
        params: {
          identifier: contactEmail,
          challengeId: challenge.data.challengeId,
        },
      } as any);
    } catch (error) {
      if (__DEV__) console.error("Registration failed", error);
      feedback("Unable to create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const stepMeta = STEP_META[step];

  return (
    <Page>
      <TopBar title="Create account" />

      <View style={{ gap: 22, paddingTop: 8 }}>
        {/* Step Progress Bar */}
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[1, 2, 3, 4].map((index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height: 5,
                borderRadius: 999,
                backgroundColor: index <= step ? colors.emerald : "#DCE5DF",
              }}
            />
          ))}
        </View>

        {/* Welcome / Step Header */}
        <View
          style={{
            backgroundColor: colors.navy,
            borderRadius: 26,
            padding: 23,
            gap: 13,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 15,
              backgroundColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="person-add-outline"
              size={25}
              color={colors.orange}
            />
          </View>

          <View style={{ gap: 7 }}>
            <Text
              style={{
                color: colors.orange,
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 1.5,
              }}
            >
              {stepMeta.eyebrow}
            </Text>

            <Text
              style={{
                color: colors.white,
                fontSize: 27,
                fontWeight: "800",
                lineHeight: 35,
              }}
            >
              {stepMeta.title}
            </Text>

            <Text
              style={{
                color: "#D9E2E9",
                fontSize: 14,
                lineHeight: 22,
              }}
            >
              {stepMeta.subtitle}
            </Text>
          </View>

          <View
            style={{
              position: "absolute",
              width: 145,
              height: 145,
              borderRadius: 73,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              right: -50,
              top: -55,
            }}
          />
        </View>

        {/* STEP 1: Personal information */}
        {step === 1 && (
          <View style={{ gap: 15 }}>
            <View style={{ gap: 5 }}>
              <Text
                style={{
                  color: colors.navy,
                  fontSize: 19,
                  fontWeight: "800",
                }}
              >
                Personal information
              </Text>

              <Text style={styles.caption}>
                Tell us a little about yourself.
              </Text>
            </View>

            <Field
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
            />

            <View style={{ gap: 6 }}>
              <Field
                label="Username"
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  clearFieldError("username");
                }}
                placeholder="Choose a username"
                autoCapitalize="none"
              />
              {fieldErrors.username ? (
                <Text
                  accessibilityRole="alert"
                  style={{ color: "#B42318", fontSize: 12, fontWeight: "600" }}
                >
                  {fieldErrors.username}
                </Text>
              ) : null}
            </View>

            <View style={{ gap: 6 }}>
              <Field
                label="Email address"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  clearFieldError("email");
                }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {fieldErrors.email ? (
                <Text
                  accessibilityRole="alert"
                  style={{ color: "#B42318", fontSize: 12, fontWeight: "600" }}
                >
                  {fieldErrors.email}
                </Text>
              ) : null}
            </View>

            <View style={{ gap: 6 }}>
              <Field
                label="Phone number"
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  clearFieldError("phone");
                }}
                placeholder="+254 712 345 678"
                keyboardType="phone-pad"
              />
              {fieldErrors.phone ? (
                <Text
                  accessibilityRole="alert"
                  style={{ color: "#B42318", fontSize: 12, fontWeight: "600" }}
                >
                  {fieldErrors.phone}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {/* STEP 2: Location */}
        {step === 2 && (
          <View style={{ gap: 13 }}>
            <View style={{ gap: 5 }}>
              <Text
                style={{
                  color: colors.navy,
                  fontSize: 19,
                  fontWeight: "800",
                }}
              >
                Where are you based?
              </Text>

              <Text style={styles.caption}>
                Select your county and town to discover nearby opportunities.
              </Text>
            </View>

            <Text style={styles.label}>County</Text>

            <Pressable
              onPress={() => setCountyModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`Selected county: ${county}. Tap to change`}
              style={{
                minHeight: 54,
                borderWidth: 1,
                borderColor: "#DCE5DF",
                borderRadius: 13,
                paddingHorizontal: 15,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.white,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 11 }}
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.emerald}
                />

                <Text
                  style={{
                    color: colors.navy,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {county}
                </Text>
              </View>

              <Ionicons name="chevron-down" size={19} color="#718078" />
            </Pressable>

            <Text style={styles.label}>Town</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 7 }}
            >
              {COUNTY_TOWNS[county].map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={town === item}
                  onPress={() => setTown(item)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* County selection modal */}
        <Modal
          visible={countyModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeCountyModal}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(10,25,20,0.55)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: "#F7FAF8",
                borderTopLeftRadius: 25,
                borderTopRightRadius: 25,
                padding: 20,
                height: "82%",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 17,
                }}
              >
                <View style={{ gap: 4 }}>
                  <Text
                    style={{
                      color: colors.navy,
                      fontSize: 20,
                      fontWeight: "800",
                    }}
                  >
                    Select your county
                  </Text>

                  <Text style={styles.caption}>
                    {`All ${KENYAN_COUNTIES.length} counties in Kenya`}
                  </Text>
                </View>

                <Pressable
                  onPress={closeCountyModal}
                  accessibilityRole="button"
                  accessibilityLabel="Close county selection"
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={28}
                    color={colors.navy}
                  />
                </Pressable>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: colors.white,
                  borderRadius: 13,
                  borderWidth: 1,
                  borderColor: "#DCE5DF",
                  paddingHorizontal: 13,
                  marginBottom: 15,
                }}
              >
                <Ionicons name="search-outline" size={19} color="#718078" />

                <TextInput
                  value={countySearch}
                  onChangeText={setCountySearch}
                  placeholder="Search counties..."
                  placeholderTextColor="#87938C"
                  style={{
                    flex: 1,
                    height: 48,
                    color: colors.navy,
                    fontSize: 14,
                  }}
                />

                {countySearch.length > 0 && (
                  <Pressable
                    onPress={() => setCountySearch("")}
                    accessibilityRole="button"
                    accessibilityLabel="Clear county search"
                  >
                    <Ionicons name="close" size={18} color="#718078" />
                  </Pressable>
                )}
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {filteredCounties.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => selectCounty(item)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#E7EDE9",
                      backgroundColor:
                        county === item ? "#E8F5EE" : "transparent",
                      borderRadius: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#87938C",
                          width: 23,
                          fontSize: 12,
                        }}
                      >
                        {KENYAN_COUNTIES.indexOf(item) + 1}.
                      </Text>

                      <Text
                        style={{
                          color: colors.navy,
                          fontSize: 14,
                          fontWeight: county === item ? "800" : "500",
                        }}
                      >
                        {item}
                      </Text>
                    </View>

                    {county === item && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.emerald}
                      />
                    )}
                  </Pressable>
                ))}

                {filteredCounties.length === 0 && (
                  <View style={{ padding: 25, alignItems: "center" }}>
                    <Text style={styles.caption}>
                      No matching county found.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* STEP 3: Security */}
        {step === 3 && (
          <View style={{ gap: 15 }}>
            <View style={{ gap: 5 }}>
              <Text
                style={{
                  color: colors.navy,
                  fontSize: 19,
                  fontWeight: "800",
                }}
              >
                Secure your account
              </Text>

              <Text style={styles.caption}>
                Create a strong password to protect your account.
              </Text>
            </View>

            <PasswordField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a strong password"
              visible={showPassword}
              onToggle={() => setShowPassword((visible) => !visible)}
            />

            {password.length > 0 && (
              <View
                style={{
                  backgroundColor: "#F0F7F2",
                  padding: 14,
                  borderRadius: 14,
                  gap: 10,
                }}
              >
                <Text
                  style={{
                    color: colors.navy,
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  Password requirements
                </Text>

                {passwordChecks.map((check) => (
                  <View
                    key={check.label}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 9,
                    }}
                  >
                    <Ionicons
                      name={
                        check.valid ? "checkmark-circle" : "ellipse-outline"
                      }
                      size={16}
                      color={check.valid ? colors.emerald : "#87938C"}
                    />

                    <Text
                      style={{
                        fontSize: 12,
                        color: check.valid ? colors.emerald : "#718078",
                      }}
                    >
                      {check.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <PasswordField
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Enter your password again"
              visible={showConfirm}
              onToggle={() => setShowConfirm((visible) => !visible)}
            />

            {confirmPassword.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Ionicons
                  name={
                    password === confirmPassword
                      ? "checkmark-circle"
                      : "alert-circle-outline"
                  }
                  size={16}
                  color={
                    password === confirmPassword ? colors.emerald : "#C17A36"
                  }
                />

                <Text
                  style={{
                    fontSize: 12,
                    color:
                      password === confirmPassword ? colors.emerald : "#C17A36",
                  }}
                >
                  {password === confirmPassword
                    ? "Passwords match"
                    : "Passwords do not match"}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* STEP 4: Interests & Account Benefits */}
        {step === 4 && (
          <>
            <View style={{ gap: 13 }}>
              <View style={{ gap: 5 }}>
                <Text
                  style={{
                    color: colors.navy,
                    fontSize: 19,
                    fontWeight: "800",
                  }}
                >
                  What interests you?
                </Text>

                <Text style={styles.caption}>
                  Choose from the categories below or add your own.
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {INTERESTS.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    selected={interests.includes(item)}
                    onPress={() => toggleInterest(item)}
                  />
                ))}
              </View>

              {/* Custom interest input */}
              <View style={{ gap: 9, marginTop: 5 }}>
                <Text style={styles.label}>Add your own interest</Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 9,
                  }}
                >
                  <TextInput
                    value={customInterest}
                    onChangeText={setCustomInterest}
                    placeholder="e.g. Real estate, logistics..."
                    placeholderTextColor="#87938C"
                    maxLength={40}
                    returnKeyType="done"
                    onSubmitEditing={addCustomInterest}
                    style={{
                      flex: 1,
                      height: 49,
                      backgroundColor: colors.white,
                      borderWidth: 1,
                      borderColor: "#DCE5DF",
                      borderRadius: 12,
                      paddingHorizontal: 13,
                      fontSize: 13,
                      color: colors.navy,
                    }}
                  />

                  <Pressable
                    onPress={addCustomInterest}
                    accessibilityRole="button"
                    accessibilityLabel="Add custom interest"
                    style={{
                      height: 49,
                      width: 49,
                      borderRadius: 12,
                      backgroundColor: colors.emerald,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="add" size={25} color={colors.white} />
                  </Pressable>
                </View>

                <Text style={styles.caption}>
                  {interests.length} of {MAX_INTERESTS} interests selected
                </Text>
              </View>

              {/* Selected interests */}
              {interests.length > 0 && (
                <View
                  style={{
                    backgroundColor: "#F0F7F2",
                    padding: 14,
                    borderRadius: 15,
                    gap: 10,
                  }}
                >
                  <Text
                    style={{
                      color: colors.navy,
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    Your selected interests
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {interests.map((item) => (
                      <Pressable
                        key={item}
                        onPress={() => toggleInterest(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove interest ${item}`}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          backgroundColor: colors.white,
                          borderWidth: 1,
                          borderColor: "#DCE5DF",
                          borderRadius: 20,
                          paddingHorizontal: 10,
                          paddingVertical: 7,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.navy,
                            fontSize: 11,
                            fontWeight: "600",
                          }}
                        >
                          {item}
                        </Text>

                        <Ionicons
                          name="close-circle"
                          size={15}
                          color={colors.emerald}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Account benefits */}
            <View
              style={[
                styles.card,
                {
                  padding: 17,
                  gap: 12,
                  backgroundColor: "#F0F7F2",
                  borderRadius: 20,
                },
              ]}
            >
              <Text style={styles.cardTitle}>
                One account. More opportunities.
              </Text>

              {[
                "Discover and connect with local businesses",
                "Build your personal profile",
                "Explore products, services and business stories",
                "Connect with entrepreneurs and communities",
              ].map((item) => (
                <View
                  key={item}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 9,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={17}
                    color={colors.emerald}
                  />

                  <Text
                    style={{
                      color: "#52665C",
                      fontSize: 12,
                      flex: 1,
                    }}
                  >
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Step Navigation / Submit */}
        <View style={{ gap: 13, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {step > 1 && (
              <Pressable
                onPress={goBack}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Go to previous step"
                style={{
                  minHeight: 54,
                  paddingHorizontal: 18,
                  borderRadius: 15,
                  borderWidth: 1,
                  borderColor: "#DCE5DF",
                  backgroundColor: colors.white,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                <Ionicons name="arrow-back" size={18} color={colors.navy} />
                <Text
                  style={{
                    color: colors.navy,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Back
                </Text>
              </Pressable>
            )}

            <View style={{ flex: 1 }}>
              {step < 4 ? (
                <Button
                  title="Continue"
                  icon="arrow-forward"
                  onPress={goNext}
                />
              ) : (
                <Button
                  title={busy ? "Creating account..." : "Create my account"}
                  icon="arrow-forward"
                  disabled={busy}
                  onPress={() => void register()}
                />
              )}
            </View>
          </View>

          {step === 4 && (
            <Text
              style={{
                color: "#87938C",
                fontSize: 11,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              By creating an account, you agree to use Mabiz responsibly
              and respect other members of the community.
            </Text>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              paddingVertical: 10,
            }}
          >
            <Text style={styles.caption}>Already have an account?</Text>

            <Pressable
              onPress={() => router.replace("/auth/login")}
              accessibilityRole="link"
              accessibilityLabel="Sign in"
              hitSlop={8}
            >
              <Text
                style={{
                  color: colors.emerald,
                  fontSize: 13,
                  fontWeight: "800",
                }}
              >
                Sign in
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Page>
  );
}