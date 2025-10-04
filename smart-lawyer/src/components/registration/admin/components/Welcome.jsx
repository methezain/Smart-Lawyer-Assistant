import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Welcome() {
  const navigate = useNavigate();

  // Registration steps
  const steps = [
    {
      number: 1,
      name: "Firm Information",
      desc: "Enter your firm's details and contact information. Enter your firm's details and contact information. Enter your firm's details and contact information.",
    },
    {
      number: 2,
      name: "Credentials",
      desc: "Enter your firm's details and contact information. Enter your firm's details and contact information. Enter your firm's details and contact information.",
    },
    {
      number: 3,
      name: "Pricing",
      desc: "Enter your firm's details and contact information. Enter your firm's details and contact information. Enter your firm's details and contact information.",
    },
    {
      number: 4,
      name: "Billing",
      desc: "Enter your firm's details and contact information. Enter your firm's details and contact information. Enter your firm's details and contact information.",
    },
    {
      number: 5,
      name: "Verification",
      desc: "Enter your firm's details and contact information. Enter your firm's details and contact information. Enter your firm's details and contact information.",
    },
  ];

  // Required documents checklist
  const requirements = [
    {
      label: "Valid government issued ID or Bar Council Certificate",
      info: "Accepted: CNIC, Passport, Bar Council Certificate",
    },
    {
      label: "Recent bank account statement or credit card statement",
      info: "For billing and verification purposes",
    },
    {
      label: "Chargeable credit or debit card",
      info: "For subscription and payment processing",
    },
    {
      label: "Mobile phone",
      info: null,
    },
  ];

  return (
    <>
      <Header />
      <div className="flex justify-center gap-6 mt-[65px] h-[80.56dvh]">
        {/* Left: Steps Overview */}
        <div className="w-[55%]">
          <div>
            <h1 className="text-2xl font-bold text-[#04121B] my-6">
              Welcome! Here's what to expect
            </h1>
            <ol className="space-y-6 mt-10">
              {steps.map((step) => (
                <li key={step.number} className="flex items-start gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#00A4B4] text-white font-bold text-lg">
                    {step.number}
                  </div>
                  <div>
                    <div className="font-semibold text-[#04121B] text-sm -mt-1 mb-0.5">
                      {step.name}
                    </div>
                    <div className="text-gray-600 text-xs max-w-2xl">
                      {step.desc}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="w-full flex justify-center mt-12">
            <button
              className="bg-[#00A4B4] text-white tracking-wider capitalize py-2 w-1/2 rounded-full shadow hover:bg-[#0496a3] transition-colors text-sm cursor-pointer"
              onClick={() => navigate("/register-your-firm-as-an-admin")}
            >
              let’s begin
            </button>
          </div>
        </div>
        {/* Right: Checklist */}
        <div className="w-[25%]">
          <div>
            <h2 className="text-lg font-semibold text-[#04121B] m-6">
              What you'll need:
            </h2>
            <ul className="space-y-5 text-sm">
              {requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">
                    <i className="ri-check-line text-lg"></i>
                  </span>
                  <span>
                    {req.label}
                    {req.info && (
                      <span
                        className="ml-1 text-gray-400 align-middle cursor-pointer"
                        title={req.info}
                      >
                        <i className="ri-information-line"></i>
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* Footer */}
      <Footer />
    </>
  );
}
