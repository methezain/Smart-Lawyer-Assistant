import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  useAdminLoginMutation,
  useStaffLoginMutation,
  useListFirmsQuery,
  useStartLoginSessionMutation,
} from "../../reduxstore/services/AdminAuthAPI";

import { useClientLoginMutation } from "../../reduxstore/services/ClientAuthAPI";
import { setCredentials } from "../../reduxstore/features/authSlice";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firmId, setFirmId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // RTK Query mutations for admin and client login
  const [adminLogin] = useAdminLoginMutation();
  const [staffLogin] = useStaffLoginMutation();
  const { data: firms = [] } = useListFirmsQuery(undefined, {
    skip: userRole !== "staff",
  });
  const [clientLogin] = useClientLoginMutation();
  const [startLoginSession] = useStartLoginSessionMutation();

  useEffect(() => {
    // Extract role from URL path
    const pathParts = location.pathname.split("/");
    const role = pathParts[pathParts.length - 1];
    setUserRole(role);
  }, [location]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  //

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Clear any existing session
      localStorage.removeItem("access_token");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("clientToken");
      localStorage.removeItem("user_name");
      localStorage.removeItem("client_name");
      localStorage.removeItem("userRole");
      localStorage.removeItem("user");
      localStorage.removeItem("client");

      if (userRole === "admin") {
        // Use real API for admin login
        console.log("Attempting admin login with:", { username, password });

        const loginResult = await adminLogin({
          username: username,
          password: password,
        }).unwrap();

        console.log("Admin login result:", loginResult);

        if (loginResult.status === "success") {
          const { data } = loginResult;

          // Check verification status before allowing login
          if (!data.is_verified) {
            // User is not verified, check if rejected or pending
            const verificationStatus = data.verification_status || "pending";

            if (verificationStatus === "rejected") {
              setError(
                "❌ Your registration has been rejected. Please contact support for further assistance."
              );
            } else if (verificationStatus === "pending") {
              setError(
                "⏳ Your registration is still pending approval. Please wait for admin verification to complete."
              );
            } else {
              setError(
                "⚠️ Your account is not verified. Please contact support for assistance."
              );
            }

            // Clear any stored tokens to prevent access
            localStorage.removeItem("admin_token");
            localStorage.removeItem("user_name");
            localStorage.removeItem("userRole");
            localStorage.removeItem("user");

            return; // Exit early, don't proceed with login
          }

          // User is verified, proceed with login
          const userData = {
            id: data.user_id,
            username: data.username,
            email: data.email,
            firmId: data.firm_id,
            firmName: data.firm_name,
            isVerified: data.is_verified,
            role: "admin",
            userDetails: data.user_details,
          };

          // Store in localStorage
          localStorage.setItem("admin_token", data.access_token);
          localStorage.setItem("user_name", data.username);
          localStorage.setItem("userRole", "admin");
          localStorage.setItem("user", JSON.stringify(userData));

          // 🔥 CRITICAL: Update Redux state with user data
          dispatch(
            setCredentials({
              token: data.access_token,
              user: userData,
            })
          );

          console.log("✅ Redux state updated with user data:", userData);

          // Store remember me preference
          if (rememberMe) {
            localStorage.setItem("rememberMe", "true");
          }

          // Redirect to admin dashboard with username route
          navigate(`/admin/${data.username}`, { replace: true });
        } else {
          setError(loginResult.message || "Login failed");
        }
      } else if (userRole === "client") {
        // Use real API for client login
        console.log("Attempting client login with:", { username, password });

        const loginResult = await clientLogin({
          username: username,
          password: password,
        }).unwrap();

        console.log("Client login result:", loginResult);

        if (loginResult.status === "success") {
          const { data } = loginResult;

          // Store client authentication data
          localStorage.setItem("clientToken", data.access_token);
          localStorage.setItem("client_name", data.client.username);
          localStorage.setItem("userRole", "client");
          localStorage.setItem(
            "client",
            JSON.stringify({
              id: data.client.id,
              username: data.client.username,
              full_name: data.client.full_name,
              email: data.client.email,
              phone: data.client.phone,
              profile_image_path: data.client.profile_image_path,
              isVerified: data.client.is_verified,
              role: "client",
            })
          );

          // Store remember me preference
          if (rememberMe) {
            localStorage.setItem("rememberMe", "true");
          }

          // Check if there's a pending firm contact
          const pendingFirm = localStorage.getItem("pendingContactFirm");

          // Redirect based on pending contact
          if (pendingFirm) {
            // If there's a pending firm contact, redirect to client username route and pass firm data
            const firmData = JSON.parse(pendingFirm);
            // Clear the pending firm from localStorage
            localStorage.removeItem("pendingContactFirm");

            navigate(`/client/${data.client.username}`, {
              state: {
                openChat: true,
                firmData,
              },
              replace: true,
            });
          } else {
            // Regular navigation if no pending firm
            navigate(`/client/${data.client.username}`, { replace: true });
          }
        } else {
          setError(loginResult.message || "Login failed");
        }
      } else if (userRole === "staff") {
        if (!firmId) {
          setError("Please enter your firm ID");
          return;
        }
        const loginResult = await staffLogin({
          username,
          password,
          firm_id: Number(firmId),
        }).unwrap();

        if (loginResult.status === "success") {
          const { data } = loginResult;

          // Store staff authentication data
          localStorage.setItem("admin_token", data.access_token);
          localStorage.setItem("user_name", data.username);
          localStorage.setItem("userRole", "staff");
          const userData = {
            id: data.user_id,
            username: data.username,
            firmId: data.firm_id,
            role: "staff",
            userDetails: data.user_details,
          };
          localStorage.setItem("user", JSON.stringify(userData));

          // Update Redux auth to reuse existing token plumbing
          dispatch(
            setCredentials({
              token: data.access_token,
              user: userData,
            })
          );

          // Remember me
          if (rememberMe) localStorage.setItem("rememberMe", "true");

          navigate(`/staff/${data.username}`, { replace: true });

          // Record login activity for this staff user (best-effort)
          try {
            await startLoginSession({
              id: data.user_id,
              body: {
                staff_id: data.user_id,
                ip: undefined,
                user_agent: navigator.userAgent,
              },
            }).unwrap();
          } catch (e) {
            console.warn("Login session record failed (non-blocking)", e);
          }
        } else {
          setError(loginResult.message || "Login failed");
        }
      }
    } catch (error) {
      console.error("Login error:", error);

      // Handle RTK Query errors
      if (error?.data?.message) {
        setError(error.data.message);
      } else if (error?.data?.errors && error.data.errors.length > 0) {
        setError(error.data.errors[0].message);
      } else {
        setError(error?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#dededa] h-dvh w-full overflow-hidden flex justify-between">
      <div className="h-full w-1/2 p-6">
        <div
          className="bg-cover bg-center h-full w-full relative"
          style={{
            backgroundImage: 'url("/order.png")',
          }}
        >
          <div className="w-full h-full bg-[#0c0c0c]/65 relative flex justify-start items-start p-6 text-white">
            <h1 className="text-4xl ">LOGO</h1>
          </div>
        </div>
      </div>
      <div className="h-full w-1/2 bg-[#dededa] text-[#0c0c0c] p-6 flex justify-center items-center relative">
        <div className="flex flex-col justify-center items-center w-[275px] capitalize text-center">
          {/* Title */}
          <h1 className="text-[36px]">
            {userRole === "client"
              ? "Client Portal"
              : userRole === "admin"
              ? "Admin Portal"
              : "Staff Portal"}
          </h1>
          {/* Description */}
          <p className="my-2 text-xs">
            {userRole === "client" ? (
              <p>
                Where you cummunicate and get real time insites regarding your
                case.
              </p>
            ) : userRole === "admin" ? (
              <p>Where you manage and</p>
            ) : (
              <p>Where you handle and</p>
            )}
          </p>
          {/* Fields */}
          <form onSubmit={handleLogin} className="w-full">
            {userRole === "staff" && (
              <div className="my-4 relative w-[275px]">
                <select
                  name="firmId"
                  id="firmId"
                  value={firmId}
                  onChange={(e) => setFirmId(e.target.value)}
                  className="w-[275px] border-2 rounded-xl border-[#0c0c0c] text-[12px] py-1.5 bg-transparent focus:outline-none focus:border-[#0c0c0c] transition-colors pl-2 focus:bg-[#dededa] focus:text-[#0c0c0c] tracking-wide"
                  disabled={loading}
                >
                  <option value="">Select your firm</option>
                  {firms.map((f) => {
                    const label = f.username
                      ? `${f.username} — ${f.firm_name || "Unnamed Firm"}`
                      : f.firm_name || "Unnamed Firm";
                    return (
                      <option key={f.id} value={f.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
            <div className="my-4 relative w-[275px]">
              <input
                type="text"
                name="text"
                id="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-[275px] border-2 rounded-xl border-[#0c0c0c] text-[12px] py-1.5 bg-transparent focus:outline-none focus:border-[#0c0c0c] transition-colors pl-2 peer focus:bg-[#dededa] focus:text-[#0c0c0c] tracking-wide placeholder-transparent"
                placeholder="Enter Your Email"
                disabled={loading}
              />
              <label
                htmlFor="email"
                className={`text-[#0c0c0c] bg-[#dededa] px-1 text-[12px] font-medium tracking-wide absolute left-2 top-2 cursor-text transition-all duration-200 transform ${
                  username
                    ? "-translate-y-[17px] text-[12px]"
                    : "top-2  text-[12px]"
                } peer-focus:-translate-y-[17px] peer-focus:text-[12px]`}
              >
                Username
              </label>
            </div>

            <div className="my-2 relative w-[275px]">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-[275px] border-2 rounded-xl border-[#0c0c0c] text-[12px] py-1.5 bg-transparent focus:outline-none focus:border-[#0c0c0c] transition-colors pl-2 peer focus:bg-[#dededa] focus:text-[#0c0c0c]  tracking-wide placeholder-transparent"
                placeholder="Enter Password"
                disabled={loading}
              />

              <button
                type="button"
                className="absolute right-2 top-1.5"
                onClick={togglePasswordVisibility}
                disabled={loading}
              >
                <i
                  className={`ri-eye${
                    showPassword ? "" : "-off"
                  }-line text-[#0c0c0c] cursor-pointer`}
                ></i>
              </button>

              <label
                htmlFor="password"
                className={`text-[#0c0c0c] bg-[#dededa] px-1 text-[12px] font-medium tracking-wide absolute left-2 top-2  cursor-text transition-all duration-200 transform ${
                  password
                    ? "-translate-y-[17px] text-[12px]"
                    : "top-2  text-[12px]"
                } peer-focus:-translate-y-[17px] peer-focus:text-[12px]`}
              >
                Password
              </label>
            </div>

            <div className="flex items-center justify-start w-[275px] my-3">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 size-3.5 appearance-none bg-[#dededa] border-2 border-[#0c0c0c] rounded cursor-pointer checked:bg-[#0c0c0c] checked:border-[#0c0c0c] focus:outline-none relative after:content-['✓'] after:text-white after:text-xs after:absolute after:bottom-[-2px] after:left-[0.8px] after:opacity-0 checked:after:opacity-100"
                disabled={loading}
              />
              <label
                htmlFor="rememberMe"
                className="text-[12px] font-medium tracking-wide cursor-pointer select-none"
              >
                Remember Me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl w-[275px] py-2 text-[12px] mt-2 tracking-wider font-bold text-[#dededa] bg-[#0c0c0c] hover:bg-[#dededa] hover:text-[#0c0c0c] border-2 border-[#0c0c0c] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
            {error && (
              <p className="text-[12px] text-red-500 mt-3 text-left">
                <i className="ri-error-warning-line mr-1"></i>
                {error}
              </p>
            )}
          </form>

          {/* Your registration is pending */}

          <div className="capitalize text-[12px] text-right w-full hover:underline mt-3 ">
            {userRole === "admin" ? (
              <Link to="/auth/admin/forgot-password">forgot password ?</Link>
            ) : userRole === "client" ? (
              <Link to="/auth/client/forgot-password">forgot password ?</Link>
            ) : (
              <Link to="/forgotpassword">forgot password ?</Link>
            )}
          </div>

          <p className=" tracking-wider capitalize mb-2 text-left  w-full">
            {userRole === "client" ? (
              <p className="text-[12px] w-60 mt-4 relative">
                Don't have an account?{" "}
                <img
                  src="/lineblack.svg"
                  className="absolute top-5 w-[60px] left-[155px]"
                  alt=""
                />
                <Link to="/register-yourself-as-a-client" className="font-bold">
                  Sign up
                </Link>
              </p>
            ) : userRole === "admin" ? (
              <p className="text-[12px] w-60  mt-4 relative">
                Don't have an account?{" "}
                <img
                  src="/lineblack.svg"
                  className="absolute top-5 w-[60px] left-[155px]"
                  alt=""
                />
                <Link
                  to="/register-your-firm-as-an-admin"
                  className="font-bold"
                >
                  Register
                </Link>
              </p>
            ) : (
              <p className="text-[12px] w-60  mt-4 relative">
                Don't have an account?{" "}
                <img
                  src="/lineblack.svg"
                  className="absolute top-5 w-[60px] left-[145px]"
                  alt=""
                />
                <Link to="/signup" className="font-bold">
                  Contact
                </Link>
              </p>
            )}
          </p>

          <button
            onClick={() => navigate("/auth")}
            className="text-[12px] mt-4 hover:underline font-bold cursor-pointer"
            disabled={loading}
          >
            Back to Role Selection
          </button>
        </div>
        <p className="text-xs absolute bottom-5 right-7">
          © 2025 smartlawyer.inc & its affiliates
        </p>
      </div>
    </div>
  );
}
