import React, { useState, useEffect } from "react";

export default function Credentials({
  formData,
  handleChange,
  nextFormStep,
  prevFormStep,
}) {
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [apiResponseMessage, setApiResponseMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [emailValid, setEmailValid] = useState(true);

  useEffect(() => {
    const password = formData.password || "";
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [formData.password]);

  useEffect(() => {
    setPasswordMatch(
      formData.password === formData.confirmPassword ||
        !formData.confirmPassword
    );
  }, [formData.password, formData.confirmPassword]);

  useEffect(() => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(!formData.email || emailRegex.test(formData.email));
  }, [formData.email]);

  const getPasswordStrengthScore = () => {
    return Object.values(passwordStrength).filter(Boolean).length;
  };

  const getPasswordStrengthColor = () => {
    const score = getPasswordStrengthScore();
    if (score <= 2) return "bg-red-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    const score = getPasswordStrengthScore();
    if (score <= 2) return "Weak";
    if (score <= 3) return "Fair";
    if (score <= 4) return "Good";
    return "Strong";
  };

  // Validate all credential fields
  const validateCredentials = () => {
    const errors = {};

    // Username validation
    if (!formData.username) {
      errors.username = "Username is required";
    } else if (formData.username.length < 4) {
      errors.username = "Username must be at least 4 characters";
    }

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!emailValid) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (getPasswordStrengthScore() < 4) {
      errors.password = "Password is not strong enough";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (!passwordMatch) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit when clicking continue
  const handleContinue = async () => {
    // Validate fields first
    if (!validateCredentials()) {
      return; // Don't proceed if validation fails
    }

    // Check if CNIC number is available (should be set from previous step)
    if (!formData.cnicNumber) {
      setFieldErrors({
        general:
          "Missing CNIC number from user information. Please go back and complete the first step.",
      });
      setApiResponseMessage(
        "Missing CNIC number from user information. Please go back and complete the first step."
      );
      return;
    }

    // If validation passes, proceed to next step
    if (nextFormStep) {
      nextFormStep();
    }
  };

  // Helper function to render error message
  const renderError = (field) => {
    return fieldErrors[field] ? (
      <p className="mt-1 text-xs text-red-500">{fieldErrors[field]}</p>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-md font-bold text-[#04121B] mb-3">
          Set Your Credentials
        </h2>
        <p className="text-xs mb-3 opacity-45">
          After registration, you'll be able to access your firm's dashboard
          using these credentials. Keep your password secure and do not share it
          with unauthorized individuals.
        </p>
      </div>

      {/* API Response Message */}
      {apiResponseMessage && (
        <div className="bg-red-100 border text-sm border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
          <p>{apiResponseMessage}</p>
        </div>
      )}

      {/* Username Field */}
      <div className="max-w-md mx-auto text-xs">
        <label
          htmlFor="username"
          className="block font-semibold text-gray-700 mb-1"
        >
          Username<span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          className={`w-full px-4 py-2 border ${
            fieldErrors.username ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:ring-2 focus:ring-[#00A4B4] focus:border-transparent`}
          placeholder="Choose a unique username"
        />
        {renderError("username")}
        <p className="mt-1 text-xs text-gray-500">
          This will be your unique identifier on the platform
        </p>
      </div>

      {/* Email Field */}
      <div className="max-w-md mx-auto text-xs">
        <label
          htmlFor="email"
          className="block font-semibold text-gray-700 mb-1"
        >
          Email<span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          required
          className={`w-full px-4 py-2 border ${
            fieldErrors.email
              ? "border-red-500"
              : !emailValid
              ? "border-red-300"
              : "border-gray-300"
          } rounded-lg focus:ring-2 focus:ring-[#00A4B4] focus:border-transparent`}
          placeholder="Enter your email address"
        />
        {renderError("email")}
        <p className="mt-1 text-xs text-gray-500">
          Your email will be used for account recovery and notifications
        </p>
      </div>

      {/* Password Field */}
      <div className="max-w-md mx-auto text-xs">
        <label
          htmlFor="password"
          className="block font-semibold text-gray-700 mb-1"
        >
          Password<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => setPasswordFocus(true)}
            onBlur={() => setPasswordFocus(false)}
            required
            className={`w-full px-4 py-2 border ${
              fieldErrors.password ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:ring-2 focus:ring-[#00A4B4] focus:border-transparent`}
            placeholder="Create a strong password"
          />
        </div>
        {renderError("password")}

        {/* Password Strength Indicator */}
        {(passwordFocus || formData.password) && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                  style={{
                    width: `${(getPasswordStrengthScore() / 5) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">
                {getPasswordStrengthText()}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <i
                  className={`ri-${
                    passwordStrength.length
                      ? "check-line text-green-500"
                      : "close-line text-red-500"
                  }`}
                ></i>
                <span className="text-xs text-gray-600">
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i
                  className={`ri-${
                    passwordStrength.uppercase
                      ? "check-line text-green-500"
                      : "close-line text-red-500"
                  }`}
                ></i>
                <span className="text-xs text-gray-600">
                  At least one uppercase letter
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i
                  className={`ri-${
                    passwordStrength.lowercase
                      ? "check-line text-green-500"
                      : "close-line text-red-500"
                  }`}
                ></i>
                <span className="text-xs text-gray-600">
                  At least one lowercase letter
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i
                  className={`ri-${
                    passwordStrength.number
                      ? "check-line text-green-500"
                      : "close-line text-red-500"
                  }`}
                ></i>
                <span className="text-xs text-gray-600">
                  At least one number
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i
                  className={`ri-${
                    passwordStrength.special
                      ? "check-line text-green-500"
                      : "close-line text-red-500"
                  }`}
                ></i>
                <span className="text-xs text-gray-600">
                  At least one special character
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="max-w-md mx-auto text-xs">
        <label
          htmlFor="confirmPassword"
          className="block font-semibold text-gray-700 mb-1"
        >
          Confirm Password<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00A4B4] focus:border-transparent ${
              fieldErrors.confirmPassword
                ? "border-red-500"
                : formData.confirmPassword
                ? passwordMatch
                  ? "border-green-500"
                  : "border-red-500"
                : "border-gray-300"
            }`}
            placeholder="Confirm your password"
          />
          {formData.confirmPassword && !fieldErrors.confirmPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <i
                className={`ri-${
                  passwordMatch
                    ? "check-line text-green-500"
                    : "close-line text-red-500"
                }`}
              ></i>
            </div>
          )}
        </div>
        {renderError("confirmPassword")}
      </div>

      {/* Password Tips */}
      <div className="bg-blue-50 p-4 rounded-lg text-xs max-w-md mx-auto">
        <h3 className="font-semibold text-blue-800 mb-2">Password Tips</h3>
        <ul className=" text-blue-700 space-y-1">
          <li>• Use a unique password that you don't use elsewhere</li>
          <li>• Consider using a password manager for better security</li>
          <li>• Change your password periodically</li>
          <li>• Never share your password with anyone</li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-12 flex text-xs justify-center gap-6">
        <button
          type="button"
          onClick={prevFormStep}
          className="bg-gray-200 text-gray-800 px-24 py-2 cursor-pointer hover:bg-gray-300 transition-colors"
          >
          Back to Firm Info
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={isLoading}
          className={`bg-[#00A4B4] text-white px-24 py-2 cursor-pointer ${
            isLoading ? "opacity-70" : "hover:bg-opacity-90"
          } transition-colors`}
        >
          {isLoading ? "Processing..." : "Continue to Pricing"}
        </button>
      </div>
    </div>
  );
}
