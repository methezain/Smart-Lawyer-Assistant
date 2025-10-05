import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompleteAdminRegistrationMutation } from "../../../reduxstore/services/RegistrationAPI";

// Step components
import FirmInfo from "./modules/FirmInfo";
import Credentials from "./modules/Credentials";
import BillingInfo from "./modules/BillingInfo";
import Pricing from "./modules/Pricing";
import Verification from "./modules/Verification";
import RegistrationComplete from "./modules/Complete";
import Header from "./components/Header";

export default function RegisterFirm() {
  const navigate = useNavigate();
  const [completeRegistration] = useCompleteAdminRegistrationMutation();

  // Loading state - used in handleFinalSubmission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState({});

  // State for tracking registration progress
  const [registrationProgress, setRegistrationProgress] = useState({
    userInfo: false,
    firmInfo: false,
    contactInfo: false,
    credentials: false,
    pricing: false,
    billingInfo: false,
    verification: false,
  });

  // State for API response messages
  const [apiMessages, setApiMessages] = useState({});

  const [currentStep, setCurrentStep] = useState(1);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // State for storing all registration data locally
  const [registrationData, setRegistrationData] = useState({
    userInfo: null,
    firmInfo: null,
    contactInfo: null,
    credentials: null,
    pricing: null,
    billingInfo: null,
    verification: null,
  });

  // State for the form data
  const [formData, setFormData] = useState({
    // User Information
    firstName: "",
    middleName: "",
    lastName: "",
    cnicNumber: "",
    dateOfBirth: "",
    cnicFront: null,
    cnicBack: null,

    // Firm Info
    profileImage: null,
    bannerImage: null, // Added banner image
    firmName: "",
    firmTitle: "", // Added firm title
    advisory: [], // Changed to array for multiple advisory items
    firmType: "",
    establishedYear: "",
    services: [],
    specialty: [],
    secondarySpecialties: [],
    description: "",

    // Contact Info
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
    email: "",
    website: "",

    // Office Hours - Updated to use ranges instead of individual days
    officeHours: [], // New range-based office hours system

    // Credentials
    username: "",
    password: "",
    confirmPassword: "",

    // Pricing - Updated validation logic
    caseFee: "",
    caseCurrency: "PKR",
    caseUnit: "case",
    hourlyRate: "",
    hourlyCurrency: "PKR",
    hourlyUnit: "hourly",
    consultationFee: "",
    consultationCurrency: "PKR",
    consultationUnit: "hourly",
    freeConsultation: false, // Added free consultation option
    retainerFee: "",
    retainerCurrency: "PKR",
    retainerUnit: "monthly",
    paymentMethods: [], // JSON array of accepted payment methods

    // Billing Info
    bankName: "",
    accountTitle: "",
    accountNumber: "",
    iban: "",
    swiftCode: "",
    branchCode: "",
    taxId: "",
    vatNumber: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZipCode: "",
    billingCountry: "",

    // Verification
    documentType: "",
    documentFile_front: null,
    documentFile_back: null,
    documentFile_certificate: null,
    barCouncilNumber: "",
    affiliation: "",
    termsAccepted: false,
  });

  // Basic field validation
  const validateFields = (step) => {
    const errors = {};

    // FirmInfo component now handles step 1 validation itself
    if (step === 2) {
      // Credentials
      if (!formData.username) errors.username = "Username is required";
      if (!formData.email) errors.email = "Email is required";
      if (!formData.password) errors.password = "Password is required";
      if (formData.password !== formData.confirmPassword)
        errors.confirmPassword = "Passwords do not match";
    } else if (step === 3) {
      // Pricing - Updated validation for either/or pricing model
      const hasCaseFee = formData.caseFee && parseFloat(formData.caseFee) > 0;
      const hasHourlyRate =
        formData.hourlyRate && parseFloat(formData.hourlyRate) > 0;

      if (!hasCaseFee && !hasHourlyRate) {
        errors.pricing = "Please set either a case fee or hourly rate";
      }

      // Consultation fee validation (only if not free)
      if (!formData.freeConsultation && !formData.consultationFee) {
        errors.consultationFee =
          "Consultation fee is required or check free consultation";
      }
    } else if (step === 4) {
      // Billing Info
      if (!formData.bankName) errors.bankName = "Bank name is required";
      if (!formData.accountTitle)
        errors.accountTitle = "Account title is required";
      if (!formData.accountNumber)
        errors.accountNumber = "Account number is required";
    } else if (step === 5) {
      // Verification
      if (!formData.documentType)
        errors.documentType = "Document type is required";
      if (!formData.barCouncilNumber)
        errors.barCouncilNumber = "Bar council number is required";
      if (!formData.termsAccepted)
        errors.termsAccepted = "Please accept terms and conditions";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setFormData({
        ...formData,
        [name]: files[0],
      });
    } else if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else if (
      name === "specialty" ||
      name === "services" ||
      name === "secondarySpecialties"
    ) {
      // Handle array-based selections (handled by individual components)
      setFormData({
        ...formData,
        [name]: value,
      });
    } else if (name === "advisory") {
      // Handle advisory array
      setFormData({
        ...formData,
        [name]: value,
      });
    } else if (name === "officeHours") {
      // Handle office hours ranges
      setFormData({
        ...formData,
        [name]: value,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: "",
      });
    }
  };

  const nextStep = () => {
    // Validate fields before proceeding
    if (validateFields(currentStep)) {
      // Update services data when moving to next step if currently in pricing step
      if (currentStep === 4) {
        // Steps handled by respective components
      }

      // For step 2 (Credentials), the Credentials component itself handles validation and API calls
      // before calling nextFormStep (which calls this function)
      setCurrentStep((prevStep) => prevStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  // Update registration data for current step
  const updateStepData = (stepData) => {
    setRegistrationData((prev) => ({
      ...prev,
      [currentStep === 1
        ? "userInfo"
        : currentStep === 2
        ? "credentials"
        : currentStep === 3
        ? "pricing"
        : currentStep === 4
        ? "billingInfo"
        : currentStep === 5
        ? "verification"
        : ""]: stepData,
    }));
  };

  // Handle final submission
  const handleFinalSubmission = async (verificationData) => {
    console.log("handleFinalSubmission called with:", verificationData);
    console.log("Current formData:", formData);
    setIsSubmitting(true);
    try {
      // Final guard: pricing & consultation mutual-exclusivity before building FormData
      const finalErrors = {};
      const hasCaseFee = formData.caseFee && parseFloat(formData.caseFee) > 0;
      const hasHourly = formData.hourlyRate && parseFloat(formData.hourlyRate) > 0;
      if (!hasCaseFee && !hasHourly) {
        finalErrors.pricing = "Provide either a case fee or an hourly rate";
      }
      if (hasCaseFee && hasHourly) {
        finalErrors.pricing = "Only one pricing model allowed (case OR hourly)";
      }
      if (formData.freeConsultation) {
        if (formData.consultationFee && formData.consultationFee.trim() !== "") {
          finalErrors.consultationFee = "Remove consultation fee when free consultation is enabled";
        }
      } else {
        if (!formData.consultationFee || formData.consultationFee.trim() === "") {
          finalErrors.consultationFee = "Consultation fee required unless free consultation is enabled";
        }
      }
      if (Object.keys(finalErrors).length) {
        setFieldErrors((prev) => ({ ...prev, ...finalErrors }));
        setIsSubmitting(false);
        return; // Abort submit
      }

      // Create a FormData object to handle file uploads
      const submitFormData = new FormData();

      // Normalize dateOfBirth to backend expected format YYYY-MM-DD if user entered DD/MM/YYYY or DD-MM-YYYY
      const normalizedFormData = { ...formData };
      if (normalizedFormData.dateOfBirth) {
        const raw = normalizedFormData.dateOfBirth.trim();
        // Accept separators '/' or '-'
        const sep = raw.includes('/') ? '/' : (raw.includes('-') ? '-' : null);
        if (sep) {
            const parts = raw.split(sep);
            // If user entered DD-MM-YYYY or DD/MM/YYYY (length 3 and first part length <=2)
            if (parts.length === 3) {
              const [p1, p2, p3] = parts;
              // Heuristic: if last segment has 4 chars assume it's YYYY
              if (p3.length === 4 && p1.length <= 2 && p2.length <= 2) {
                // Convert to YYYY-MM-DD ensuring zero padding
                const dd = p1.padStart(2, '0');
                const mm = p2.padStart(2, '0');
                normalizedFormData.dateOfBirth = `${p3}-${mm}-${dd}`;
              }
            }
        }
        // If already in YYYY-MM-DD leave as-is
      }

      // Add all form data directly from the formData state
      Object.entries(normalizedFormData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          // Handle file uploads
          if (
            (key === "cnicFront" ||
            key === "cnicBack" ||
            key === "profileImage" ||
            key === "bannerImage") &&
            value instanceof File
          ) {
            submitFormData.append(key, value);
          }
          // Handle array fields that need JSON stringification
          else if (Array.isArray(value)) {
            submitFormData.append(key, JSON.stringify(value));
          }
          // Handle regular fields
          else {
            submitFormData.append(key, value);
          }
        }
      });

      // Add verification data from the final step
      if (verificationData) {
        console.log("Adding verification data to FormData:", verificationData);
        Object.entries(verificationData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (key.includes("documentFile_") && value instanceof File) {
              submitFormData.append(key, value);
            } else {
              submitFormData.append(key, value);
            }
          }
        });
      }

      // Ensure required fields have default values
      if (!submitFormData.has("advisory")) {
        submitFormData.append("advisory", JSON.stringify([]));
      }
      if (!submitFormData.has("officeHours")) {
        submitFormData.append("officeHours", JSON.stringify([]));
      }
      if (!submitFormData.has("paymentMethods")) {
        submitFormData.append("paymentMethods", JSON.stringify([]));
      }

      // Log the FormData contents for debugging
      console.log("FormData contents:");
      for (let pair of submitFormData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      // Submit all data at once
      const response = await completeRegistration(submitFormData).unwrap();
      console.log("API Response:", response);

      // Set verification as complete
      setRegistrationProgress((prev) => ({
        ...prev,
        verification: true,
      }));
      setApiMessages((prev) => ({
        ...prev,
        verification: "Registration completed successfully",
      }));

      // Move to completion step
      setCurrentStep(6);
    } catch (error) {
      console.error("Registration error:", error);
      // Log the full error object
      console.log("Full error object:", error);
      setApiMessages((prev) => ({
        ...prev,
        general:
          error.message ||
          error.data?.detail ||
          error.data?.message ||
          "An error occurred during registration. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // The form submission is now handled by individual components,
    // this is just a fallback for direct form submissions
  };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // Progress indicators
  const steps = [
    { number: 1, name: "Information" },
    { number: 2, name: "Credentials" },
    { number: 3, name: "Pricing" },
    { number: 4, name: "Billing" },
    { number: 5, name: "Verification" },
    { number: 6, name: "Complete" },
  ];

  // FAQ data
  const faqItems = {
    firmInfo: [
      {
        question: "What documents do I need for firm registration?",
        answer:
          "You'll need your CNIC (front and back), Bar Council Certificate, and Bar Council Registration Number. All documents should be clear and legible.",
      },
      {
        question: "What are the requirements for the firm logo?",
        answer:
          "The firm logo should be in JPG, PNG, or GIF format, with a recommended size of 300x300px and maximum file size of 2MB.",
      },
      {
        question: "How many practice areas can I select?",
        answer:
          "You can select up to 3 primary practice areas and 2 secondary practice areas. This helps clients better understand your firm's expertise.",
      },
      {
        question: "What information is required for office hours?",
        answer:
          "You need to specify opening and closing times for each day of the week. You can mark days as closed if your office doesn't operate on those days.",
      },
      {
        question: "Is the website field mandatory?",
        answer:
          "No, the website field is optional. However, having a website can help establish your firm's online presence and credibility.",
      },
    ],
    credentials: [
      {
        question: "What are the password requirements?",
        answer:
          "Your password must be at least 8 characters long and include a combination of letters, numbers, and special characters.",
      },
      {
        question: "Can I change my username later?",
        answer:
          "Yes, you can update your username through your account settings after registration.",
      },
      {
        question: "What if I forget my password?",
        answer:
          "You can reset your password using the 'Forgot Password' feature on the login page.",
      },
    ],
    pricing: [
      {
        question: "What are the different types of fees I can set?",
        answer:
          "You can set several types of fees: Case Fee (for specific legal cases), Consultation Fee (for initial meetings), Retainer Fee (ongoing service commitment), and Standard Hourly Rate (for general legal services). Each can be set in different currencies (PKR, USD, EUR, GBP) and time units (hourly, per session, fixed fee).",
      },
      {
        question: "How should I set my consultation fee?",
        answer:
          "Your consultation fee should reflect your expertise and market rates. Consider offering different rates for different types of consultations (initial, follow-up, specialized). You can charge per hour, per session, or a fixed fee depending on your preference.",
      },
      {
        question: "What is a retainer fee and how should I set it?",
        answer:
          "A retainer fee is an upfront payment that secures your services. It can be set monthly, quarterly, or annually. This fee helps ensure commitment from clients and provides you with a stable income. Consider your typical case load and client needs when setting this amount.",
      },
      {
        question: "How do I determine my hourly rate?",
        answer:
          "Your hourly rate should consider your experience, specialization, market rates, and operating costs. Research rates in your area and practice area. Remember that your rate reflects your expertise and the value you provide to clients.",
      },
      {
        question: "What payment methods can I accept?",
        answer:
          "You can accept multiple payment methods including Cash, Credit Card, Bank Transfer, and Online Payments. Offering various payment options makes it easier for clients to pay and can help attract more business.",
      },
      {
        question: "Can I update my pricing later?",
        answer:
          "Yes, you can modify your service pricing at any time through your firm's dashboard. However, it's recommended to honor existing client agreements and provide notice of any price changes to ongoing clients.",
      },
    ],
    billing: [
      {
        question: "What is the SmartLawyer.ai Professional Plan?",
        answer:
          "The SmartLawyer.ai Professional Plan is a monthly subscription service priced at $39.99 that provides comprehensive legal practice management tools, client management, case tracking, and other professional features to help you manage your law practice efficiently.",
      },
      {
        question: "What banking information is required?",
        answer:
          "You'll need to provide your bank name, account title, account number, IBAN, SWIFT/BIC code, and branch code. This information is required for processing your monthly subscription fee and managing payments for your legal services.",
      },
      {
        question: "What tax information do I need to provide?",
        answer:
          "You need to provide your Tax ID/NTN (National Tax Number) and VAT Number (if applicable). This information is required for proper tax reporting and compliance with Pakistani tax regulations.",
      },
      {
        question: "Is my banking information secure?",
        answer:
          "Yes, all banking and financial information is encrypted and securely stored using industry-standard security protocols. We use advanced encryption methods to protect your sensitive data and ensure it's only used for processing your subscription and service payments.",
      },
      {
        question: "What happens if my payment fails?",
        answer:
          "If a payment fails, you'll receive a notification via email. Your account will remain active for a grace period, during which you can update your payment information. If the payment issue isn't resolved, your account may be temporarily suspended until payment is processed successfully.",
      },
      {
        question: "Can I change my billing information later?",
        answer:
          "Yes, you can update your billing information at any time through your account settings. Changes to banking details will be verified before being applied to ensure security. It's important to keep your billing information up to date to avoid any service interruptions.",
      },
    ],
    verification: [
      {
        question: "What documents do I need for verification?",
        answer:
          "You need to provide either your Bar Council Registration License (front and back sides) or your Bar Council Enrollment Certificate. The documents should be clear, legible images in JPG or PNG format, with a maximum size of 5MB.",
      },
      {
        question: "What is the Bar Council Registration Number?",
        answer:
          "This is your unique identification number issued by your respective Bar Council. It's required to verify your legal practice credentials and should be entered exactly as it appears on your registration documents.",
      },
      {
        question: "Which Bar Council should I select?",
        answer:
          "Select the Bar Council you are registered with: Pakistan Bar Council, Punjab Bar Council, Sindh Bar Council, Balochistan Bar Council, Khyber Pakhtunkhwa Bar Council, or Islamabad Bar Council. This helps us verify your credentials with the correct authority.",
      },
      {
        question: "How long does verification take?",
        answer:
          "Verification typically takes 2-3 business days after submission of all required documents. You'll receive an email notification once the verification is complete. Your law firm will not be visible on our platform until verification is approved.",
      },
      {
        question: "What if my verification is rejected?",
        answer:
          "If your verification is rejected, you'll receive a detailed explanation of the reason. You can then resubmit the correct documents or information. Common reasons for rejection include unclear documents, incorrect registration numbers, or mismatched information.",
      },
      {
        question: "Can I update my verification documents later?",
        answer:
          "Yes, you can update your verification documents through your account settings. However, any changes will require re-verification, and your firm's visibility may be temporarily affected during this process.",
      },
    ],
    completion: [
      {
        question: "What happens after I submit my registration?",
        answer:
          "After submission, our team will review your registration details and verification documents. You'll receive an email notification once the verification is complete. Upon approval, your firm profile will be activated on our platform, and you can access your firm's dashboard using your credentials.",
      },
      {
        question: "How long does the review process take?",
        answer:
          "The review process typically takes 2-3 business days. During this time, our team will verify your documents and information. You'll be notified via email once the review is complete.",
      },
      {
        question: "When can I access my firm's dashboard?",
        answer:
          "You can access your firm's dashboard once your registration is approved. You'll receive an email notification with instructions on how to log in using the credentials you created during registration.",
      },
      {
        question: "What if I need help during the review process?",
        answer:
          "If you need any assistance during the review process, you can contact our support team at support@smartlawyer.ai. Our team is available to help you with any questions or concerns.",
      },
      {
        question: "Can I make changes to my registration after submission?",
        answer:
          "Yes, you can update your registration information through your account settings after approval. However, any changes to verification documents will require re-verification. It's important to ensure all information is accurate before submission.",
      },
    ],
  };

  // Get current FAQ items based on step
  const getCurrentFaqItems = () => {
    switch (currentStep) {
      case 1:
        return faqItems.firmInfo;
      case 2:
        return faqItems.credentials;
      case 3:
        return faqItems.pricing;
      case 4:
        return faqItems.billing;
      case 5:
        return faqItems.verification;
      case 6:
        return faqItems.completion;
      default:
        return faqItems.firmInfo;
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      <Header />
      <div className="container mx-auto px-4 pt-[85px] pb-8">
        <div className="flex justify-center gap-8">
          {/* Main Content Section - Left Side */}
          <div className="w-[55%] bg-white shadow-2xl">
            {/* Progress Header */}
            <div className="text-[#04121B] p-6 rounded-t-lg">
              <div className="flex items-center justify-between w-full">
                {steps.map((step, idx) => (
                  <React.Fragment key={step.number}>
                    <div className="flex flex-col items-center relative">
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 transition-colors duration-200
                          ${
                            step.number === currentStep ||
                            step.number < currentStep
                              ? "bg-[#04121B] border-[#04121B] text-white"
                              : "bg-white border-[#04121B] text-[#04121B]"
                          }
                        `}
                      >
                        {step.number < currentStep ? (
                          <i className="ri-check-line text-white"></i>
                        ) : (
                          <span
                            className={
                              step.number === currentStep
                                ? "text-white"
                                : "text-[#04121B]"
                            }
                          >
                            {step.number}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-semibold mt-1 ${
                          step.number === currentStep
                            ? "text-[#04121B]"
                            : step.number < currentStep
                            ? "text-[#04121B]"
                            : "text-[#04121B]"
                        }`}
                      >
                        {step.name}
                      </span>
                    </div>
                    {/* Render line except after last step */}
                    {idx < steps.length - 1 && (
                      <div
                        className={`flex-1 h-[1.6px] mx-2 -mt-[26px] transition-colors duration-200 rounded-2xl
                          ${
                            step.number < currentStep
                              ? "bg-[#04121B]"
                              : "bg-gray-200"
                          }
                        `}
                        style={{ minWidth: 32 }}
                      ></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Form Container */}
            <div className="p-8">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Firm Information */}
                {currentStep === 1 && (
                  <FirmInfo
                    formData={formData}
                    handleChange={handleChange}
                    nextFormStep={() => {
                      updateStepData(formData);
                      nextStep();
                    }}
                  />
                )}

                {/* Step 2: Credentials */}
                {currentStep === 2 && (
                  <Credentials
                    formData={formData}
                    handleChange={handleChange}
                    nextFormStep={() => {
                      updateStepData(formData);
                      nextStep();
                    }}
                    prevFormStep={prevStep}
                  />
                )}

                {/* Step 3: Service Pricing */}
                {currentStep === 3 && (
                  <Pricing
                    formData={formData}
                    handleChange={handleChange}
                    nextFormStep={() => {
                      updateStepData(formData);
                      nextStep();
                    }}
                    prevFormStep={prevStep}
                  />
                )}

                {/* Step 4: Billing Information */}
                {currentStep === 4 && (
                  <BillingInfo
                    formData={formData}
                    handleChange={handleChange}
                    nextFormStep={() => {
                      updateStepData(formData);
                      nextStep();
                    }}
                    prevFormStep={prevStep}
                  />
                )}

                {/* Step 5: Verification */}
                {currentStep === 5 && (
                  <Verification
                    formData={formData}
                    handleChange={handleChange}
                    nextFormStep={(verificationData) => {
                      console.log(
                        "Verification data received in nextFormStep:",
                        verificationData
                      );
                      updateStepData(verificationData);
                      handleFinalSubmission(verificationData);
                    }}
                    prevFormStep={prevStep}
                    apiMessages={apiMessages}
                    isSubmitting={isSubmitting}
                  />
                )}

                {/* Step 6: Registration Complete */}
                {currentStep === 6 && (
                  <RegistrationComplete
                    registrationProgress={registrationProgress}
                    apiMessages={apiMessages}
                  />
                )}

                {/* Navigation Buttons - Only shown for completion step now */}
                {currentStep === 6 && (
                  <div className="mt-8 flex justify-center gap-6">
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="bg-[#00A4B4] text-xs text-white px-24 py-2 cursor-pointer hover:bg-opacity-90 transition-colors"
                    >
                      Back to Home
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* FAQ Section - Right Side */}
          <div className="w-[25%] ">
            <div className="p-6 sticky top-[85px]">
              <h2 className="text-sm font-bold text-gray-600 mb-4">
                Frequently Asked Questions
              </h2>
              <div className="space-y-2 text-xs">
                {getCurrentFaqItems().map((faq, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-200 last:border-0"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between py-2 text-left focus:outline-none"
                    >
                      <h3 className="font-semibold text-gray-700 pr-2">
                        {faq.question}
                      </h3>
                      <span
                        className={`transform transition-transform duration-200 ${
                          expandedFaq === index ? "rotate-180" : ""
                        }`}
                      >
                        <i className="ri-arrow-up-s-line text-xl text-gray-500"></i>
                      </span>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        expandedFaq === index
                          ? "max-h-40 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-gray-600 pb-4">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl text-xs mt-14">
                <h1 className="my-2 mx-1">
                  if face any issue than contact us.{" "}
                </h1>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <i className="ri-customer-service-2-line text-amber-500 text-xl mb-2"></i>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">
                    Support
                  </h4>
                  <p className="text-xs text-gray-600">
                    support@smartlawyer.ai
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
