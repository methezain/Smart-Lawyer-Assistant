import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAdminResetPasswordMutation } from "../../reduxstore/services/AdminAuthAPI";
import { useClientResetPasswordMutation } from "../../reduxstore/services/ClientAuthAPI";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [userType, setUserType] = useState(""); // admin or client

  const navigate = useNavigate();
  const location = useLocation();
  const [adminResetPassword] = useAdminResetPasswordMutation();
  const [clientResetPassword] = useClientResetPasswordMutation();

  useEffect(() => {
    // Determine user type from URL path
    const pathSegments = location.pathname.split("/");
    const type =
      pathSegments.includes("admin")
        ? "admin"
        : pathSegments.includes("client")
        ? "client"
        : "";
    setUserType(type);

    if (!type) {
      navigate("/auth");
      return;
    }

    // Get stored data from previous verification step based on user type
    let storedToken, storedUsername, storedFullName;

    if (type === "admin") {
      storedToken = localStorage.getItem("verified_reset_token");
      storedUsername = localStorage.getItem("reset_username");
      storedFullName = localStorage.getItem("reset_user_name");

      if (!storedToken || !storedUsername) {
        navigate("/auth/admin/forgot-password");
        return;
      }
    } else if (type === "client") {
      storedToken = localStorage.getItem("client_verified_reset_token");
      storedUsername = localStorage.getItem("client_reset_username");
      storedFullName = localStorage.getItem("client_reset_user_name");

      if (!storedToken || !storedUsername) {
        navigate("/auth/client/forgot-password");
        return;
      }
    }

    setResetToken(storedToken);
    setUsername(storedUsername);
    setFullName(storedFullName || "");
  }, [navigate, location]);

  const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push(
        "Password must contain at least one special character (@$!%*?&)"
      );
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError({});
    setSuccessMessage("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setServerError({
        confirmPassword: "Passwords do not match",
      });
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setServerError({
        newPassword: passwordErrors[0], // Show first error
      });
      return;
    }

    setIsLoading(true);

    try {
      let result;

      if (userType === "admin") {
        result = await adminResetPassword({
          reset_token: resetToken,
          new_password: newPassword,
          confirm_password: confirmPassword, // Add confirm_password field
        }).unwrap();
      } else if (userType === "client") {
        result = await clientResetPassword({
          reset_token: resetToken,
          new_password: newPassword,
          confirm_password: confirmPassword, // Add confirm_password field
        }).unwrap();
      }

      if (result.status === "success") {
        setSuccessMessage("Password reset successfully!");

        // Clear all stored reset data based on user type
        if (userType === "admin") {
          localStorage.removeItem("reset_token");
          localStorage.removeItem("reset_email");
          localStorage.removeItem("verified_reset_token");
          localStorage.removeItem("reset_username");
          localStorage.removeItem("reset_user_name");
        } else if (userType === "client") {
          localStorage.removeItem("client_reset_token");
          localStorage.removeItem("client_reset_contact");
          localStorage.removeItem("client_verified_reset_token");
          localStorage.removeItem("client_reset_username");
          localStorage.removeItem("client_reset_user_name");
        }

        // Navigate to appropriate login after a short delay
        setTimeout(() => {
          const loginPath = userType === "admin" ? "/auth/admin" : "/auth/client";
          navigate(loginPath, {
            state: {
              message: "Password reset successfully! You can now log in with your new password.",
              username: username,
            },
          });
        }, 2000);
      }
    } catch (err) {
      console.error("Password reset error:", err);
      const errorData = err?.data;

      if (errorData?.errors && errorData.errors.length > 0) {
        const error = errorData.errors[0];
        setServerError({
          general: error.message,
        });
      } else {
        setServerError({
          general: errorData?.message || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getBackLink = () => {
    return userType === "admin" ? "/auth/admin/verify-reset-otp" : "/auth/client/verify-reset-otp";
  };

  const getSignInLink = () => {
    return userType === "admin" ? "/auth/admin" : "/auth/client";
  };

  return (
    <div className="bg-[#dededa] text-[#0c0c0c] h-dvh w-full overflow-hidden flex items-center justify-center">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-md flex flex-col justify-center items-center">
        <div className="flex flex-col justify-center items-center text-center">
          <div className="flex flex-col items-center gap-2">
            <img src="/logoblack.svg" className="size-24" alt="Logo" />
            <h1 className="text-[20px] font-bold tracking-wider">
              Set New Password
            </h1>
            {fullName && (
              <p className="text-[12px] text-gray-600 max-w-[275px] text-center">
                Welcome back,{" "}
                <span className="font-semibold">{fullName}</span>
              </p>
            )}
            {username && (
              <p className="text-[11px] text-gray-500 max-w-[275px] text-center">
                Username:{" "}
                <span className="font-mono font-semibold">{username}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            {/* New Password Field */}
            <div className="my-3 relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-[275px] border-2 rounded-lg border-[#0c0c0c] text-[12px] py-1.5 bg-transparent focus:outline-none transition-colors pl-2 pr-10 peer focus:bg-[#dededa] focus:text-[#0c0c0c] tracking-wide placeholder-transparent"
                placeholder="New Password"
                required
                disabled={isLoading}
              />
              <label
                htmlFor="newPassword"
                className={`text-[#0c0c0c] bg-[#dededa] px-1 text-[12px] font-medium tracking-wide absolute left-2 top-2 cursor-text transition-all duration-200 transform ${
                  newPassword
                    ? "-translate-y-[17px] text-[12px]"
                    : "top-2 text-[12px]"
                } peer-focus:-translate-y-[17px] peer-focus:text-[12px]`}
              >
                New Password
              </label>
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-2 text-[12px] hover:text-gray-600"
                disabled={isLoading}
              >
                {showNewPassword ? "🙈" : "👁️"}
              </button>
              {serverError.newPassword && (
                <p className="text-[10px] mt-1 ml-2 text-left text-red-500">
                  {serverError.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="my-3 relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-[275px] border-2 rounded-lg border-[#0c0c0c] text-[12px] py-1.5 bg-transparent focus:outline-none transition-colors pl-2 pr-10 peer focus:bg-[#dededa] focus:text-[#0c0c0c] tracking-wide placeholder-transparent"
                placeholder="Confirm Password"
                required
                disabled={isLoading}
              />
              <label
                htmlFor="confirmPassword"
                className={`text-[#0c0c0c] bg-[#dededa] px-1 text-[12px] font-medium tracking-wide absolute left-2 top-2 cursor-text transition-all duration-200 transform ${
                  confirmPassword
                    ? "-translate-y-[17px] text-[12px]"
                    : "top-2 text-[12px]"
                } peer-focus:-translate-y-[17px] peer-focus:text-[12px]`}
              >
                Confirm Password
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-2 text-[12px] hover:text-gray-600"
                disabled={isLoading}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
              {serverError.confirmPassword && (
                <p className="text-[10px] mt-1 ml-2 text-left text-red-500">
                  {serverError.confirmPassword}
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="my-3 text-left">
              <p className="text-[10px] text-gray-600 mb-1">
                Password requirements:
              </p>
              <ul className="text-[9px] text-gray-500 list-disc list-inside space-y-0.5">
                <li>At least 8 characters long</li>
                <li>One uppercase and lowercase letter</li>
                <li>One number and one special character</li>
              </ul>
            </div>

            <button
              type="submit"
              className="rounded-lg w-full capitalize py-2 text-[12px] mt-2 tracking-wider font-bold text-[#0c0c0c] border-2 border-[#0c0c0c] bg-[#dededa] hover:bg-[#0c0c0c] hover:text-[#dededa] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>

          {serverError.general && (
            <p className="text-[10px] mt-3 text-center text-red-500 max-w-[275px]">
              {serverError.general}
            </p>
          )}

          {successMessage && (
            <div className="mt-3 text-center">
              <p className="text-[10px] text-emerald-600 max-w-[275px]">
                {successMessage}
              </p>
              <p className="text-[10px] text-gray-600 mt-1 max-w-[275px]">
                Redirecting to login page...
              </p>
            </div>
          )}

          <Link
            to={getBackLink()}
            className="text-[12px] w-60 tracking-wider font-bold hover:underline mt-4"
          >
            Back to OTP Verification
          </Link>

          <div className="flex justify-center items-center gap-2 w-full text-[12px] font-semibold my-4">
            <hr className="w-28 h-[1px] my-2 bg-[#0c0c0c] border-0 rounded-full" />
            OR
            <hr className="w-28 h-[1px] my-2 bg-[#0c0c0c] border-0 rounded-full" />
          </div>

          <p className="text-[12px] w-60 tracking-wider text-center relative">
            Remember your password?{" "}
            <Link to={getSignInLink()} className="font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
