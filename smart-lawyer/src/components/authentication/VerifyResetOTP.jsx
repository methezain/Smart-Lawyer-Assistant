import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useAdminVerifyResetOTPMutation,
  useAdminForgotPasswordMutation,
} from "../../reduxstore/services/AdminAuthAPI";

export default function AdminVerifyResetOTP() {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [serverError, setServerError] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

  const navigate = useNavigate();
  const [verifyResetOTP] = useAdminVerifyResetOTPMutation();
  const [resendOTP] = useAdminForgotPasswordMutation();

  useEffect(() => {
    // Get stored data from previous step
    const storedToken = localStorage.getItem("reset_token");
    const storedEmail = localStorage.getItem("reset_email");

    if (!storedToken || !storedEmail) {
      // Redirect back to forgot password if no token
      navigate("/auth/admin/forgot-password");
      return;
    }

    setResetToken(storedToken);
    setEmail(storedEmail);

    // Set up countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError({});
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const result = await verifyResetOTP({
        reset_token: resetToken,
        otp_code: otpCode,
      }).unwrap();

      if (result.status === "success") {
        setSuccessMessage("OTP verified successfully!");

        // Store verified data for password reset
        localStorage.setItem("verified_reset_token", resetToken);
        localStorage.setItem("reset_username", result.data.username);
        localStorage.setItem("reset_user_name", result.data.full_name);

        // Navigate to password reset
        setTimeout(() => {
          navigate("/auth/admin/reset-password");
        }, 1500);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      const errorData = err?.data;

      if (errorData?.errors && errorData.errors.length > 0) {
        const error = errorData.errors[0];
        setServerError({
          otp: error.code === "INVALID_OTP" ? error.message : null,
          general: error.code !== "INVALID_OTP" ? error.message : null,
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

  const handleResendOTP = async () => {
    setServerError({});
    setResendLoading(true);

    try {
      const result = await resendOTP({ email }).unwrap();

      if (result.status === "success") {
        // Update the reset token
        setResetToken(result.data.reset_token);
        localStorage.setItem("reset_token", result.data.reset_token);

        // Reset timer
        setTimeLeft(900);
        setSuccessMessage("New OTP sent to your email!");

        // Clear the success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setServerError({
        general: "Failed to resend OTP. Please try again.",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="bg-[#dededa] text-[#0c0c0c] h-dvh w-full overflow-hidden flex items-center justify-center">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-md flex flex-col justify-center items-center">
        <div className="flex flex-col justify-center items-center text-center">
          <div className="flex flex-col items-center gap-2">
            <img src="/logoblack.svg" className="size-24" alt="Logo" />
            <h1 className="text-[20px] font-bold tracking-wider">
              Verify Reset OTP
            </h1>
            <p className="text-[12px] text-gray-600 max-w-[275px] text-center">
              Enter the 6-digit OTP sent to your email address.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="my-3 relative">
              <input
                type="email"
                name="email"
                id="email"
                value={email}
                readOnly
                className="w-[275px] border-2 rounded-lg border-gray-400 text-[12px] py-1.5 bg-gray-100 focus:outline-none pl-2 tracking-wide"
              />
              <label
                htmlFor="email"
                className="text-gray-500 bg-[#dededa] px-1 text-[12px] font-medium tracking-wide absolute left-2 -translate-y-[17px]"
              >
                Email Address
              </label>
            </div>

            <div className="my-3 relative">
              <input
                type="text"
                name="otp"
                id="otp"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-[275px] border-2 rounded-lg border-[#0c0c0c] text-[12px] py-1.5 bg-transparent focus:outline-none transition-colors pl-2 peer focus:bg-[#dededa] focus:text-[#0c0c0c] tracking-wide placeholder-transparent text-center text-lg"
                placeholder="000000"
                maxLength="6"
                required
                disabled={isLoading}
              />
              <label
                htmlFor="otp"
                className={`text-[#0c0c0c] bg-[#dededa] px-1 text-[12px] font-medium tracking-wide absolute left-2 top-2 cursor-text transition-all duration-200 transform ${
                  otpCode
                    ? "-translate-y-[17px] text-[12px]"
                    : "top-2 text-[12px]"
                } peer-focus:-translate-y-[17px] peer-focus:text-[12px]`}
              >
                6-Digit OTP
              </label>
              {serverError.otp && (
                <p className="text-[10px] mt-1 ml-2 text-left text-red-500">
                  {serverError.otp}
                </p>
              )}
            </div>

            {/* Timer Display */}
            <div className="text-center mb-3">
              {timeLeft > 0 ? (
                <p className="text-[11px] text-gray-600">
                  OTP expires in:{" "}
                  <span className="font-bold text-[#226447]">
                    {formatTime(timeLeft)}
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-red-500 font-bold">
                  OTP has expired! Please request a new one.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="rounded-lg w-full capitalize py-2 text-[12px] mt-2 tracking-wider font-bold text-[#0c0c0c] border-2 border-[#0c0c0c] bg-[#dededa] hover:bg-[#0c0c0c] hover:text-[#dededa] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || timeLeft === 0}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
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
              {successMessage.includes("verified") && (
                <p className="text-[10px] text-gray-600 mt-1 max-w-[275px]">
                  Redirecting to password reset...
                </p>
              )}
            </div>
          )}

          {/* Resend OTP Button */}
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendLoading || timeLeft > 840} // Disable for first 60 seconds
            className="text-[12px] hover:underline mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? "Resending..." : "Resend OTP"}
          </button>

          <Link
            to="/auth/admin/forgot-password"
            className="text-[12px] w-60 tracking-wider font-bold hover:underline mt-2"
          >
            Back to Email Entry
          </Link>

          <div className="flex justify-center items-center gap-2 w-full text-[12px] font-semibold my-4">
            <hr className="w-28 h-[1px] my-2 bg-[#0c0c0c] border-0 rounded-full" />
            OR
            <hr className="w-28 h-[1px] my-2 bg-[#0c0c0c] border-0 rounded-full" />
          </div>

          <p className="text-[12px] w-60 tracking-wider text-center relative">
            Remember your password?{" "}
            <Link to="/auth/admin" className="font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
