import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUserInfo } from "../../reduxstore/features/userSlice.js";
import { useClientSignupMutation } from "../../reduxstore/services/ClientRegistrationAPI";

export default function ClientSignin() {
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [full_name, setFullName] = useState("");
  const [username, setUsername] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [clientSignup, { isLoading }] = useClientSignupMutation();
  const [serverError, setServerError] = useState({});
  const [globalMessage, setGlobalMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerError({});
    setGlobalMessage("");

    const userData = {
      contact,
      password,
      full_name,
      username,
    };

    try {
      const response = await clientSignup(userData);

      if (response.error) {
        const resData = response.error;

        setGlobalMessage(resData?.message);

        if (resData?.field_errors) {
          setServerError(resData.field_errors);
        }

        return;
      }

      if (response.data?.status === "success") {
        const clientData = response.data?.data;

        // Store client data similar to admin flow
        localStorage.setItem("clientToken", clientData.access_token);
        localStorage.setItem("client_name", clientData.client.username);
        localStorage.setItem("userRole", "client");
        localStorage.setItem(
          "client",
          JSON.stringify({
            id: clientData.client.id,
            username: clientData.client.username,
            full_name: clientData.client.full_name,
            email: clientData.client.email,
            phone: clientData.client.phone,
            role: "client",
            isVerified: clientData.client.is_verified,
          })
        );

        dispatch(
          setUserInfo({
            contact,
            username: clientData.client.username || "",
            name: clientData.client.full_name || "",
          })
        );

        // Navigate to client dashboard using username route
        navigate(`/client/${clientData.client.username}`);
      }
    } catch {
      setGlobalMessage("Something went wrong. Please try again.");
    }
  };

  // Placeholder function for Google signup - will be implemented after installing packages
  const handleGoogleSignup = () => {
    setGlobalMessage(
      "Google signup requires installing @react-oauth/google package. Please install it first."
    );
  };

  return (
    <div className="bg-[#dededa] h-dvh w-full overflow-hidden grid grid-cols-2 ">
      <div className="h-full w-full p-6">
        <div
          className="bg-cover bg-right-top h-full w-full relative"
          style={{
            backgroundImage: 'url("/picture1.png")',
          }}
        >
          <div className="w-full h-full bg-[#0c0c0c]/65 relative flex justify-start items-start p-6 text-white">
            <h1 className="text-4xl ">LOGO</h1>
          </div>
        </div>
      </div>
      <div className="h-full w-full bg-[#dededa] text-[#0c0c0c] p-6 flex justify-center items-center relative">
        <div className="flex flex-col justify-center items-center w-[275px] capitalize text-center">
          <h1 className="text-[36px]">Sign up</h1>
          <p className="my-2 ">Sign up to unlock smart legal help anytime.</p>
          <p className="tracking-wider capitalize text-[12px] w-full flex flex-col gap-4">
            <div className="py-2 mt-5 w-full border-2 rounded-lg text-[12px] font-semibold border-[#0c0c0c] flex justify-center items-center gap-2">
              {/* <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="medium"
                text="signup_with"
                shape="rectangular"
                logo_alignment="left"
              /> */}
              <button
                onClick={handleGoogleSignup}
                className="w-full flex justify-center items-center gap-2"
              >
                <img
                  src="/google-logo.svg"
                  alt="Google Logo"
                  className="w-5 h-5"
                />
                Sign up with Google
              </button>
            </div>
          </p>
          <div className="flex justify-center items-center gap-2 w-full text-[12px] font-semibold my-4">
            <hr className="w-28 h-[1px] my-2 bg-[#0c0c0c] border-0 rounded-full" />
            OR
            <hr className="w-28 h-[1px] my-2 bg-[#0c0c0c] border-0 rounded-full" />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="relative w-[275px]">
              <input
                type="text"
                name="contact"
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-[275px] border-2 rounded-lg border-[#0c0c0c] text-[12px] py-1.5 bg-transparent focus:outline-none focus:border-[#0c0c0c] transition-colors pl-2 peer focus:bg-[#dededa] focus:text-[#0c0c0c] tracking-wide placeholder-transparent"
              />
              <label
                htmlFor="contact"
                className={`text-[#0c0c0c] bg-[#dededa] px-1 text-[12px] font-medium tracking-wide absolute left-2 top-2  cursor-text transition-all duration-200 transform ${
                  contact
                    ? "-translate-y-[17px] text-[12px]"
                    : "top-2  text-[12px]"
                } peer-focus:-translate-y-[17px] peer-focus:text-[12px]`}
              >
                Mobile Number or Email
              </label>
              {serverError.contact ? (
                <p className="text-[10px] mt-1 ml-2 text-left text-red-500">
                  {serverError.contact}
                </p>
              ) : serverError.phone ? (
                <p className="text-[10px] mt-1 ml-2 text-left text-red-500">
                  {serverError.phone}
                </p>
              ) : serverError.email ? (
                <p className="text-[10px] mt-1 ml-2 text-left text-red-500">
                  {serverError.email}
                </p>
              ) : null}
            </div>

            <div className="my-3 relative w-[275px]">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-[275px] border-2 rounded-lg border-[#0c0c0c] text-[12px] py-1.5 bg-transparent focus:outline-none focus:border-[#0c0c0c] transition-colors pl-2 peer focus:bg-[#dededa] focus:text-[#0c0c0c] tracking-wide placeholder-transparent"
              />
              <button
                type="button"
                className="absolute right-2 top-1.5"
                onClick={togglePasswordVisibility}
              >
                <i
                  className={`ri-eye${
                    showPassword ? "" : "-off"
                  }-line text-[#0c0c0c]`}
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
              {serverError.password ? (
                <p className="text-[10px] mt-1 ml-2 text-left text-red-500 ">
                  {serverError.password}
                </p>
              ) : null}
            </div>

            <div className="my-3 relative w-[275px]">
              <input
                type="text"
                name="full_name"
                id="full_name"
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                className="w-[275px] border-2 rounded-lg border-[#0c0c0c] text-[12px] py-1.5 bg-transparent focus:outline-none focus:border-[#0c0c0c] transition-colors pl-2 peer focus:bg-[#dededa] focus:text-[#0c0c0c] tracking-wide placeholder-transparent"
              />
              <label
                htmlFor="full_name"
                className={`text-[#0c0c0c] bg-[#dededa] px-1 text-[12px] font-medium tracking-wide absolute left-2 top-2 cursor-text transition-all duration-200 transform ${
                  full_name
                    ? "-translate-y-[17px] text-[12px]"
                    : "top-2  text-[12px]"
                } peer-focus:-translate-y-[17px] peer-focus:text-[12px]`}
              >
                Full Name
              </label>
              {serverError.full_name ? (
                <p className="text-[10px] mt-1 ml-2 text-left text-red-500">
                  {serverError.full_name}
                </p>
              ) : null}
            </div>

            <div className="my-3 relative w-[275px]">
              <input
                type="text"
                name="username"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-[275px] border-2 rounded-lg border-[#0c0c0c] text-[12px] py-1.5 bg-transparent focus:outline-none focus:border-[#0c0c0c] transition-colors pl-2 peer focus:bg-[#dededa] focus:text-[#0c0c0c] tracking-wide placeholder-transparent"
              />
              <label
                htmlFor="username"
                className={`text-[#0c0c0c] bg-[#dededa] px-1 text-[12px] font-medium tracking-wide absolute left-2 top-2  cursor-text transition-all duration-200 transform ${
                  username
                    ? "-translate-y-[17px] text-[12px]"
                    : "top-2  text-[12px]"
                } peer-focus:-translate-y-[17px] peer-focus:text-[12px]`}
              >
                Username
              </label>
              {serverError.username ? (
                <p className="text-[10px] mt-1 ml-2 text-left text-red-500">
                  {serverError.username}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="border-2 rounded-lg w-full py-2 text-[12px] mt-2 tracking-wider font-bold text-[#0c0c0c] bg-[#dededa] hover:bg-[#0c0c0c] hover:text-[#dededa] border-[#0c0c0c] transition duration-300 ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Registering..." : "Sign Up"}
            </button>
          </form>
          {globalMessage ? (
            <p className="text-[10px] mt-3 ml-2 text-left text-red-500">
              <i className="ri-error-warning-line mr-1"></i>
              {globalMessage}
            </p>
          ) : null}
          <Link
            to="/"
            className="text-[12px] w-60 tracking-wider font-bold hover:underline mt-4"
          >
            Go Back
          </Link>

          <div className="flex justify-center items-center gap-2 w-full text-[12px] font-semibold my-4">
            <hr className="w-28 h-[1px] my-2 bg-[#0c0c0c] border-0 rounded-full" />
            OR
            <hr className="w-28 h-[1px] my-2 bg-[#0c0c0c] border-0 rounded-full" />
          </div>
          <p className="text-[12px] w-60 tracking-wider text-center relative">
            Already have an account?{" "}
            <img
              src="/lineblack.svg"
              className="absolute top-5 w-[60px] left-[175px]"
              alt=""
            />
            <Link to="/auth/client" className="font-bold">
              Log in
            </Link>
          </p>
        </div>
        <p className="text-xs absolute bottom-5 right-7">
          © 2025 smartlawyer.inc & its affiliates
        </p>
      </div>
    </div>
  );
}
