import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminChangePasswordMutation } from "../../reduxstore/services/AdminAuthAPI";
import { useClientChangePasswordMutation } from "../../reduxstore/services/ClientAuthAPI";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState("");
  const [userData, setUserData] = useState({});

  const navigate = useNavigate();
  const [adminChangePassword] = useAdminChangePasswordMutation();
  const [clientChangePassword] = useClientChangePasswordMutation();

  useEffect(() => {
    // Determine user type and get user data
    const adminToken = localStorage.getItem("admin_token");
    const clientToken = localStorage.getItem("clientToken");
    const userRole = localStorage.getItem("userRole");

    if (adminToken && userRole === "admin") {
      setUserType("admin");
      const adminData = JSON.parse(localStorage.getItem("user") || "{}");
      setUserData(adminData);
    } else if (clientToken && userRole === "client") {
      setUserType("client");
      const clientData = JSON.parse(localStorage.getItem("client") || "{}");
      setUserData(clientData);
    } else {
      // No valid authentication, redirect to role selection
      navigate("/auth");
    }
  }, [navigate]);

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
        result = await adminChangePassword({
          current_password: currentPassword,
          new_password: newPassword,
        }).unwrap();
      } else if (userType === "client") {
        result = await clientChangePassword({
          current_password: currentPassword,
          new_password: newPassword,
        }).unwrap();
      }

      if (result?.status === "success") {
        setSuccessMessage("Password changed successfully!");

        // Navigate back to the appropriate dashboard after a short delay
        setTimeout(() => {
          if (userType === "admin") {
            navigate(`/admin/${userData.username}`);
          } else if (userType === "client") {
            navigate("/auth/client/profile");
          }
        }, 2000);
      }
    } catch (err) {
      console.error("Change password error:", err);
      const errorData = err?.data;

      if (errorData?.errors && errorData.errors.length > 0) {
        const error = errorData.errors[0];
        setServerError({
          currentPassword:
            error.code === "INVALID_CURRENT_PASSWORD" ? error.message : null,
          general:
            error.code !== "INVALID_CURRENT_PASSWORD" ? error.message : null,
        });
      } else {
        setServerError({
          general:
            errorData?.message || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getBackLink = () => {
    if (userType === "admin") {
      return `/admin/${userData.username}`;
    } else if (userType === "client") {
      return "/auth/client/profile";
    }
    return "/auth";
  };

  const getTitle = () => {
    if (userType === "admin") {
      return "Change Admin Password";
    } else if (userType === "client") {
      return "Change Client Password";
    }
    return "Change Password";
  };

  return (
    <div className="bg-[#dededa] text-[#0c0c0c] h-dvh w-full overflow-hidden flex items-center justify-center">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-md flex flex-col justify-center items-center">
        <div className="flex flex-col justify-center items-center text-center">
          <div className="flex flex-col items-center gap-2">
            <img src="/logoblack.svg" className="size-24" alt="Logo" />
            <h1 className="text-[20px] font-bold tracking-wider">
              {getTitle()}
            </h1>
            {userData.full_name && (
              <p className="text-[12px] text-gray-600 max-w-[275px] text-center">
                Welcome,{" "}
                <span className="font-semibold">{userData.full_name}</span>
              </p>
            )}
            {userData.username && (
              <p className="text-[11px] text-gray-500 max-w-[275px] text-center">
                Username:{" "}
                <span className="font-mono font-semibold">
                  {userData.username}
                </span>
              </p>
            )}
            <p className="text-[10px] text-blue-600 max-w-[275px] text-center">
              {userType === "admin" ? "Admin Portal" : "Client Portal"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            {/* Current Password Field */}
            <div className="my-3 relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-[275px] border-2 rounded-lg border-[#0c0c0c] text-[12px] py-1.5 bg-transparent focus:outline-none transition-colors pl-2 pr-10 peer focus:bg-[#dededa] focus:text-[#0c0c0c] tracking-wide placeholder-transparent"
                placeholder="Current Password"
                required
                disabled={isLoading}
              />
              <label
                htmlFor="currentPassword"
                className={`text-[#0c0c0c] bg-[#dededa] px-1 text-[12px] font-medium tracking-wide absolute left-2 top-2 cursor-text transition-all duration-200 transform ${
                  currentPassword
                    ? "-translate-y-[17px] text-[12px]"
                    : "top-2 text-[12px]"
                } peer-focus:-translate-y-[17px] peer-focus:text-[12px]`}
              >
                Current Password
              </label>
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2 top-2 text-[12px] hover:text-gray-600"
                disabled={isLoading}
              >
                {showCurrentPassword ? "🙈" : "👁️"}
              </button>
              {serverError.currentPassword && (
                <p className="text-[10px] mt-1 ml-2 text-left text-red-500">
                  {serverError.currentPassword}
                </p>
              )}
            </div>

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
                Confirm New Password
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
              {isLoading ? "Changing Password..." : "Change Password"}
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
                Redirecting to dashboard...
              </p>
            </div>
          )}

          <Link
            to={getBackLink()}
            className="text-[12px] w-60 tracking-wider font-bold hover:underline mt-4"
          >
            Back to{" "}
            {userType === "admin" ? "Admin Dashboard" : "Client Profile"}
          </Link>

          <div className="flex justify-center items-center gap-2 w-full text-[12px] font-semibold my-4">
            <hr className="w-28 h-[1px] my-2 bg-[#0c0c0c] border-0 rounded-full" />
            OR
            <hr className="w-28 h-[1px] my-2 bg-[#0c0c0c] border-0 rounded-full" />
          </div>

          <p className="text-[12px] w-60 tracking-wider text-center">
            Need help?{" "}
            <Link
              to={
                userType === "admin"
                  ? "/auth/admin/forgot-password"
                  : "/auth/client/forgot-password"
              }
              className="font-bold hover:underline"
            >
              Reset Password
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
