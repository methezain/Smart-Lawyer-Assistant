import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAdminForgotPasswordMutation } from "../../reduxstore/services/AdminAuthAPI";
import { useClientForgotPasswordMutation } from "../../reduxstore/services/ClientAuthAPI";

export default function ForgotPassword() {
  const [contact, setContact] = useState(""); // Changed from email to contact for client support
  const [serverError, setServerError] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState(""); // admin or client

  const navigate = useNavigate();
  const location = useLocation();

  const [adminForgotPassword] = useAdminForgotPasswordMutation();
  const [clientForgotPassword] = useClientForgotPasswordMutation();

  useEffect(() => {
    // Determine user type from URL path
    const pathSegments = location.pathname.split("/");
    const type = pathSegments.includes("admin")
      ? "admin"
      : pathSegments.includes("client")
      ? "client"
      : "";
    setUserType(type);

    // Redirect if no valid type
    if (!type) {
      navigate("/auth");
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError({});
    setSuccessMessage("");
    setIsLoading(true);

    try {
      let result;

      if (userType === "admin") {
        // For admin, contact should be email
        result = await adminForgotPassword({ email: contact }).unwrap();

        if (result.status === "success") {
          setSuccessMessage(result.message);

          // Store reset token and email in localStorage for the next step
          localStorage.setItem("reset_token", result.data.reset_token);
          localStorage.setItem("reset_email", contact);

          // Navigate to OTP verification after a short delay
          setTimeout(() => {
            navigate("/auth/admin/verify-reset-otp");
          }, 2000);
        }
      } else if (userType === "client") {
        // For client, contact can be email or phone
        result = await clientForgotPassword({ contact }).unwrap();

        if (result.status === "success") {
          setSuccessMessage(result.message);

          // Store reset token and contact in localStorage for the next step
          localStorage.setItem("client_reset_token", result.data.reset_token);
          localStorage.setItem("client_reset_contact", contact);

          // Navigate to OTP verification after a short delay
          setTimeout(() => {
            navigate("/auth/client/verify-reset-otp");
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      const errorData = err?.data;

      if (errorData?.errors && errorData.errors.length > 0) {
        const error = errorData.errors[0];
        const isNotFoundError =
          error.code === "EMAIL_NOT_FOUND" || error.code === "CONTACT_NOT_FOUND";
        setServerError({
          contact: isNotFoundError ? error.message : null,
          general: !isNotFoundError ? error.message : null,
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

  const getTitle = () => {
    return userType === "admin"
      ? "Reset Admin Password"
      : "Reset Client Password";
  };

  const getContactLabel = () => {
    return userType === "admin"
      ? "Admin Email Address"
      : "Email or Phone Number";
  };

  const getContactPlaceholder = () => {
    return userType === "admin"
      ? "Enter Your Email"
      : "Enter Your Email or Phone";
  };

  const getBackLink = () => {
    return userType === "admin" ? "/auth/admin" : "/auth/client";
  };

  const getBackText = () => {
    return userType === "admin" ? "Back to Admin Login" : "Back to Client Login";
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
            <p className="text-[12px] text-gray-600 max-w-[275px] text-center">
              Enter your email address and we'll send you an OTP to reset your
              password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="my-3 relative">
              <input
                type="email"
                name="contact"
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-[275px] border-2 rounded-lg border-[#0c0c0c] text-[12px] py-1.5 bg-transparent focus:outline-none transition-colors pl-2 peer focus:bg-[#dededa] focus:text-[#0c0c0c] tracking-wide placeholder-transparent"
                placeholder={getContactPlaceholder()}
                required
                disabled={isLoading}
              />
              <label
                htmlFor="contact"
                className={`text-[#0c0c0c] bg-[#dededa] px-1 text-[12px] font-medium tracking-wide absolute left-2 top-2 cursor-text transition-all duration-200 transform ${
                  contact
                    ? "-translate-y-[17px] text-[12px]"
                    : "top-2 text-[12px]"
                } peer-focus:-translate-y-[17px] peer-focus:text-[12px]`}
              >
                {getContactLabel()}
              </label>
              {serverError.contact && (
                <p className="text-[10px] mt-1 ml-2 text-left text-red-500">
                  {serverError.contact}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="rounded-lg w-full capitalize py-2 text-[12px] mt-2 tracking-wider font-bold text-[#0c0c0c] border-2 border-[#0c0c0c] bg-[#dededa] hover:bg-[#0c0c0c] hover:text-[#dededa] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Sending OTP..." : "Send Reset OTP"}
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
                Redirecting to OTP verification...
              </p>
            </div>
          )}

          <Link
            to={getBackLink()}
            className="text-[12px] w-60 tracking-wider font-bold hover:underline mt-4"
          >
            {getBackText()}
          </Link>

          <div className="flex justify-center items-center gap-2 w-full text-[12px] font-semibold my-4">
            <hr className="w-28 h-[1px] my-2 bg-[#0c0c0c] border-0 rounded-full" />
            OR
            <hr className="w-28 h-[1px] my-2 bg-[#0c0c0c] border-0 rounded-full" />
          </div>

          <p className="text-[12px] w-60 tracking-wider text-center relative">
            Remember your password?{" "}
            <img
              src="/lineblack.svg"
              className="absolute top-5 w-[60px] left-[145px]"
              alt=""
            />
            <Link to={getBackLink()} className="font-bold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
