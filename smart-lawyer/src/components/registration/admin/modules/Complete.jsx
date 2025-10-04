import React from "react";

const RegistrationComplete = () => {
  return (
    <div className="text-center py-8 text-xs">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <i className="ri-check-line text-3xl"></i>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Registration Complete!
      </h2>

      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Your law firm registration has been submitted successfully. Our team
        will review your information shortly.
      </p>

      <div className="bg-[#00a4b4]/10 border border-[#00a4b4]/20 rounded-lg p-4 max-w-md mx-auto mb-6">
        <h3 className=" font-semibold text-[#00A4B4] mb-2">
          What happens next?
        </h3>
        <ol className=" text-[#00A4B4] text-left list-decimal pl-5 space-y-2">
          <li>
            Our team will review your registration details and verification
            documents
          </li>
          <li>
            You'll receive an email notification once verification is complete
          </li>
          <li>
            Upon approval, your firm profile will be activated on our platform
          </li>
          <li>
            You can then access your firm's dashboard using your credentials
          </li>
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto mb-8">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <i className="ri-time-line text-amber-500 text-xl mb-2"></i>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">
            Processing Time
          </h4>
          <p className="text-xs text-gray-600">2-3 business days</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <i className="ri-customer-service-2-line text-amber-500 text-xl mb-2"></i>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Support</h4>
          <p className="text-xs text-gray-600">support@smartlawyer.ai</p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationComplete;
