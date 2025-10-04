import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "./landing/Header";
import * as firmsData from "./superadmin/firmsData";

// Move data objects outside the component to avoid recreating them on each render
const servicesData = {
  "legal-assistance": {
    id: 1,
    name: "Legal Assistance",
    description: "Get expert legal advice and assistance for your case",
    icon: "ri-scales-3-line",
  },
  "case-summarization": {
    id: 2,
    name: "Case Summarization",
    description: "AI-powered summarization of your legal cases",
    icon: "ri-file-list-3-line",
  },
  "case-classification": {
    id: 3,
    name: "Case Classification",
    description: "Automatic classification of your case type",
    icon: "ri-folder-classify-line",
  },
  "verdict-prediction": {
    id: 4,
    name: "Verdict Prediction",
    description: "Predict possible verdict outcomes for your case",
    icon: "ri-gavel-line",
  },
  "template-generation": {
    id: 5,
    name: "Template Generation",
    description: "Generate legal document templates",
    icon: "ri-file-copy-line",
  },
  "cross-examination": {
    id: 6,
    name: "Cross Examination",
    description: "Prepare for cross-examination sessions",
    icon: "ri-question-answer-line",
  },
  "contract-review": {
    id: 7,
    name: "Contract Review",
    description: "AI-assisted review of legal contracts",
    icon: "ri-file-search-line",
  },
  "legal-research": {
    id: 8,
    name: "Legal Research",
    description: "Advanced legal research and case law analysis",
    icon: "ri-book-open-line",
  },
  "document-analysis": {
    id: 9,
    name: "Document Analysis",
    description: "Analysis of legal documents and identification of key issues",
    icon: "ri-file-search-line",
  },
};

// TODO: This data will be fetched from the backend API
// Current data is dummy for development purposes
// No longer needed - replaced by firmsData utility

export default function Services() {
  const { serviceSlug, specialtyName: urlSpecialtyName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [service, setService] = useState(null);
  const [filteredFirms, setFilteredFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  // const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if this is a specialty URL pattern
  const isSpecialtyView =
    urlSpecialtyName || (serviceSlug && serviceSlug.startsWith("specialty/"));
  // Handle both URL patterns for specialties
  const specialtyName = urlSpecialtyName
    ? urlSpecialtyName.replace(/-/g, " ")
    : isSpecialtyView
    ? serviceSlug.replace("specialty/", "").replace(/-/g, " ")
    : null;

  // Parse URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const specialtyParam = specialtyName || queryParams.get("specialty");

  // Filter states
  const [filters, setFilters] = useState({
    rating: 0,
    successRate: 0,
    country: "pakistan",
    city: "",
    specialties: specialtyParam ? [specialtyParam] : [],
    casesHandled: 0,
    pricingType: "all",
    maxRate: 0,
    maxRetainer: 0,
    freeConsultation: false,
    paymentPlans: false,
  });

  // Available specialties for filter
  const allSpecialties = [
    "Civil Litigation",
    "Corporate Law",
    "Family Law",
    "Criminal Defense",
    "Personal Injury",
    "Employment Law",
    "Intellectual Property",
    "Real Estate",
    "Tax Law",
    "Legal Tech",
    "Case Analysis",
    "Document Review",
    "Case Management",
    "Legal Research",
    "Documentation",
    "Document Analysis",
    "Contract Review",
    "Document Management",
    "Legal Analysis",
    "Compliance",
  ];

  // useEffect(() => {
  //   // Check if user is authenticated
  //   const token = localStorage.getItem("token");
  //   setIsAuthenticated(!!token);
  // }, []);

  useEffect(() => {
    // Current implementation
    setLoading(true);

    if (isSpecialtyView) {
      // For specialty view, use default service but filter firms by specialty
      setService({
        id: 0,
        name: `Firms specializing in ${specialtyName}`,
        description: `Find law firms with expertise in ${specialtyName}`,
        icon: "ri-user-star-line",
      });

      // Initialize firm data if needed
      firmsData.initializeFirmData();

      // Get approved firms
      const approvedFirms = firmsData.getFirmsByStatus("approved");

      // Filter by specialty
      const firms = approvedFirms
        .filter((firm) =>
          (firm.specialties || []).some(
            (specialty) =>
              specialty.toLowerCase() === specialtyName.toLowerCase()
          )
        )
        .map((firm) => ({
          id: firm.id,
          name: firm.firmName,
          rating: firm.rating,
          casesHandled: firm.casesHandled,
          successRate: firm.successRate,
          specialties: firm.specialties || [],
          location: firm.location,
          description: firm.description,
          image:
            firm.image ||
            "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop",
          pricing: firm.pricing,
          status: firm.status,
          services: firm.services,
        }));

      setFilteredFirms(firms);
      setError(null);
    } else if (servicesData[serviceSlug]) {
      setService(servicesData[serviceSlug]);

      // Initialize firm data if needed
      firmsData.initializeFirmData();

      // Get law firms for this service
      const servicesFirmsData = firmsData.getServicesFirms();

      let firms = [];
      if (
        servicesFirmsData[serviceSlug] &&
        servicesFirmsData[serviceSlug].length > 0
      ) {
        // Use data from utility if available for this service
        firms = servicesFirmsData[serviceSlug];
      }

      // We no longer need to filter out rejected firms as the updateServicesData
      // function only includes approved firms

      setFilteredFirms(firms);
      setError(null);
    } else {
      setError("Service not found");
    }

    setLoading(false);
  }, [serviceSlug, isSpecialtyView, specialtyName, urlSpecialtyName]);

  // Apply filters whenever filters state changes
  useEffect(() => {
    // Prepare advanced filters structure
    const advancedFilters = {
      specialties: filters.specialties,
      minRating: filters.rating > 0 ? filters.rating : undefined,
      pricingType:
        filters.pricingType !== "all" ? filters.pricingType : undefined,
      location:
        filters.city ||
        (filters.country !== "all"
          ? filters.country === "pakistan"
            ? "Pakistan"
            : ""
          : ""),
    };

    // For specialty view, filter from all approved firms instead of service-specific firms
    if (isSpecialtyView) {
      // Initialize firm data if needed
      firmsData.initializeFirmData();

      // Get approved firms
      const approvedFirms = firmsData.getFirmsByStatus("approved");

      // Start with firms that match the specialty
      let filteredBySpecialty = approvedFirms
        .filter((firm) =>
          (firm.specialties || []).some(
            (specialty) =>
              specialty.toLowerCase() === specialtyName.toLowerCase()
          )
        )
        .map((firm) => ({
          id: firm.id,
          name: firm.firmName,
          rating: firm.rating,
          casesHandled: firm.casesHandled,
          successRate: firm.successRate,
          specialties: firm.specialties || [],
          location: firm.location,
          description: firm.description,
          image:
            firm.image ||
            "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop",
          pricing: firm.pricing,
          status: firm.status,
          services: firm.services,
        }));

      // Apply additional filters

      // Filter by rating
      if (filters.rating > 0) {
        filteredBySpecialty = filteredBySpecialty.filter(
          (firm) => firm.rating >= filters.rating
        );
      }

      // Filter by pricing type
      if (filters.pricingType !== "all") {
        filteredBySpecialty = filteredBySpecialty.filter(
          (firm) => firm.pricing?.type === filters.pricingType
        );
      }

      // Filter by location
      if (advancedFilters.location) {
        const locationTerm = advancedFilters.location.toLowerCase();
        filteredBySpecialty = filteredBySpecialty.filter(
          (firm) =>
            firm.location && firm.location.toLowerCase().includes(locationTerm)
        );
      }

      // Filter by success rate
      if (filters.successRate > 0) {
        filteredBySpecialty = filteredBySpecialty.filter((firm) => {
          const rate = parseInt(firm.successRate);
          return !isNaN(rate) && rate >= filters.successRate;
        });
      }

      // Filter by cases handled
      if (filters.casesHandled > 0) {
        filteredBySpecialty = filteredBySpecialty.filter(
          (firm) => firm.casesHandled >= filters.casesHandled
        );
      }

      // Filter by maximum rate
      if (filters.maxRate > 0) {
        filteredBySpecialty = filteredBySpecialty.filter((firm) => {
          if (
            firm.pricing?.type === "hourly" ||
            firm.pricing?.type === "fixed"
          ) {
            return firm.pricing.rate <= filters.maxRate;
          }
          return true;
        });
      }

      // Filter by maximum retainer
      if (filters.maxRetainer > 0) {
        filteredBySpecialty = filteredBySpecialty.filter(
          (firm) => firm.pricing?.minRetainer <= filters.maxRetainer
        );
      }

      // Filter by free consultation
      if (filters.freeConsultation) {
        filteredBySpecialty = filteredBySpecialty.filter(
          (firm) => firm.pricing?.freeConsultation
        );
      }

      // Filter by payment plans
      if (filters.paymentPlans) {
        filteredBySpecialty = filteredBySpecialty.filter(
          (firm) => firm.pricing?.paymentPlans
        );
      }

      setFilteredFirms(filteredBySpecialty);
    } else {
      // For regular service views, filter service-specific firms
      let serviceFirms = [];
      const servicesFirmsData = firmsData.getServicesFirms();

      if (
        servicesFirmsData[serviceSlug] &&
        servicesFirmsData[serviceSlug].length > 0
      ) {
        serviceFirms = servicesFirmsData[serviceSlug];

        // Apply filters directly to the service firms

        // Filter by specialties
        if (filters.specialties.length > 0) {
          serviceFirms = serviceFirms.filter((firm) =>
            filters.specialties.some((specialty) =>
              (firm.specialties || []).includes(specialty)
            )
          );
        }

        // Filter by rating
        if (filters.rating > 0) {
          serviceFirms = serviceFirms.filter(
            (firm) => firm.rating >= filters.rating
          );
        }

        // Filter by pricing type
        if (filters.pricingType !== "all") {
          serviceFirms = serviceFirms.filter(
            (firm) => firm.pricing?.type === filters.pricingType
          );
        }

        // Filter by location
        if (advancedFilters.location) {
          const locationTerm = advancedFilters.location.toLowerCase();
          serviceFirms = serviceFirms.filter(
            (firm) =>
              firm.location &&
              firm.location.toLowerCase().includes(locationTerm)
          );
        }

        // Filter by success rate
        if (filters.successRate > 0) {
          serviceFirms = serviceFirms.filter((firm) => {
            const rate = parseInt(firm.successRate);
            return !isNaN(rate) && rate >= filters.successRate;
          });
        }

        // Filter by cases handled
        if (filters.casesHandled > 0) {
          serviceFirms = serviceFirms.filter(
            (firm) => firm.casesHandled >= filters.casesHandled
          );
        }

        // Filter by maximum rate
        if (filters.maxRate > 0) {
          serviceFirms = serviceFirms.filter((firm) => {
            if (
              firm.pricing?.type === "hourly" ||
              firm.pricing?.type === "fixed"
            ) {
              return firm.pricing.rate <= filters.maxRate;
            }
            return true;
          });
        }

        // Filter by maximum retainer
        if (filters.maxRetainer > 0) {
          serviceFirms = serviceFirms.filter(
            (firm) => firm.pricing?.minRetainer <= filters.maxRetainer
          );
        }

        // Filter by free consultation
        if (filters.freeConsultation) {
          serviceFirms = serviceFirms.filter(
            (firm) => firm.pricing?.freeConsultation
          );
        }

        // Filter by payment plans
        if (filters.paymentPlans) {
          serviceFirms = serviceFirms.filter(
            (firm) => firm.pricing?.paymentPlans
          );
        }

        setFilteredFirms(serviceFirms);
      } else {
        // If no firms found for this service, set empty array
        setFilteredFirms([]);
      }
    }
  }, [filters, serviceSlug, isSpecialtyView, specialtyName]);

  // useEffect to handle changes in URL parameters
  useEffect(() => {
    if (specialtyParam) {
      // Update specialties filter when URL parameter changes
      setFilters((prev) => ({
        ...prev,
        specialties: [specialtyParam],
      }));
    }
  }, [specialtyParam]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleSpecialtyToggle = (specialty) => {
    setFilters((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const clearFilters = () => {
    setFilters({
      rating: 0,
      successRate: 0,
      country: "pakistan",
      city: "",
      specialties: [],
      casesHandled: 0,
      pricingType: "all",
      maxRate: 0,
      maxRetainer: 0,
      freeConsultation: false,
      paymentPlans: false,
    });
  };

  const handleContactClick = (firm) => {
    // If there's no contactEmail or contactPhone, check if we can get the full firm data
    if (!firm.contactEmail && !firm.contactPhone && firm.id) {
      // Use the firmsData utility to get the firm details
      const fullFirmData = firmsData.getFirmById(firm.id);

      if (fullFirmData) {
        // Merge the additional contact info
        firm = {
          ...firm,
          contactEmail: fullFirmData.email,
          contactPhone: fullFirmData.phone,
          businessHours: fullFirmData.businessHours,
        };
      }
    }

    setSelectedFirm(firm);
    setShowContactModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#dededa] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#dededa] flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-[#0c0c0c] mb-4">{error}</h2>
          <button
            onClick={() => navigate("/")}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <Header />
      <div className="mt-16">
        {/* Service/Specialty Header */}
        <div className="bg-[#0c0c0c] text-white flex justify-between items-center ">
          <div className="container mx-auto px-16 py-3">
            <div className="flex justify-between items-center mr-6">
              <div className="flex items-center">
                {isSpecialtyView || specialtyParam ? (
                  // Show specialty icon and name when filtering by specialty
                  <>
                    <i className="ri-user-star-line text-4xl mr-4"></i>
                    <div>
                      <h1 className="text-3xl font-bold">
                        Firms specializing in {specialtyParam || specialtyName}
                      </h1>
                    </div>
                  </>
                ) : (
                  // Show regular service icon and name
                  <>
                    <i
                      className={`${
                        service?.icon || "ri-scales-3-line"
                      } text-4xl mr-4`}
                    ></i>
                    <div>
                      <h1 className="text-3xl font-bold">
                        {service?.name || "Loading..."}
                      </h1>
                    </div>
                  </>
                )}
              </div>
              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="text-white tracking-wide font-semibold bg-red-400 text-xs p-2 rounded-xl cursor-pointer"
                >
                  <i class="ri-filter-2-line mr-1"></i>
                  Clear Filters
                </button>
              </div>
            </div>

            {/* {!isSpecialtyView && !specialtyParam && service && (
            <p className="text-sm text-[#dededa]/45 max-w-3xl mt-2">
              {service.description}
            </p>
          )} */}
            {/* Specialties Filter */}
            <div className="mt-3 overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0c0c0c] to-transparent z-10"></div>
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0c0c0c] to-transparent z-10"></div>
              <div className="relative w-full">
                <div
                  className="flex gap-2 whitespace-nowrap"
                  style={{
                    animation: "scroll 30s linear infinite",
                    width: "max-content",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.animationPlayState = "paused";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.animationPlayState = "running";
                  }}
                >
                  {[...allSpecialties, ...allSpecialties].map(
                    (specialty, index) => (
                      <button
                        key={`${specialty}-${index}`}
                        onClick={() => handleSpecialtyToggle(specialty)}
                        className={`px-3 py-1 rounded-lg text-sm inline-block flex--0 cursor-pointer ${
                          filters.specialties.includes(specialty)
                            ? "bg-emerald-600 text-white"
                            : "bg-[#dededa] text-[#0c0c0c] hover:bg-gray-200"
                        } transition-colors`}
                      >
                        {specialty}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
            <style>
              {`
          @keyframes scroll {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }
        `}
            </style>
          </div>
        </div>

        {/* Filters Section */}
        <div className="  text-xs border-b border-gray-300/50">
          <div className="container mx-auto px-16 py-6">
            <div className="flex flex-wrap gap-6">
              {/* Rating Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block  font-semibold text-[#0c0c0c] mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) =>
                    handleFilterChange("rating", parseFloat(e.target.value))
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  <option value="0">Any Rating</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="3.0">3.0+ Stars</option>
                </select>
              </div>

              {/* Success Rate Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block font-semibold text-[#0c0c0c] mb-2">
                  Minimum Success Rate
                </label>
                <select
                  value={filters.successRate}
                  onChange={(e) =>
                    handleFilterChange("successRate", parseInt(e.target.value))
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  <option value="0">Any Success Rate</option>
                  <option value="95">95%+</option>
                  <option value="90">90%+</option>
                  <option value="85">85%+</option>
                  <option value="80">80%+</option>
                </select>
              </div>

              {/* Country Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block font-semibold text-[#0c0c0c] mb-2">
                  Country
                </label>
                <select
                  value={filters.country}
                  onChange={(e) =>
                    handleFilterChange("country", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  <option value="all">All Countries</option>
                  <option value="pakistan">Pakistan</option>
                  <option value="other">Other Countries</option>
                </select>
              </div>

              {/* City Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block font-semibold text-[#0c0c0c] mb-2">
                  City/Location
                </label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => handleFilterChange("city", e.target.value)}
                  placeholder="Enter city or area"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Cases Handled Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block font-semibold text-[#0c0c0c] mb-2">
                  Minimum Cases Handled
                </label>
                <select
                  value={filters.casesHandled}
                  onChange={(e) =>
                    handleFilterChange("casesHandled", parseInt(e.target.value))
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  <option value="0">Any Number</option>
                  <option value="1000">1000+ Cases</option>
                  <option value="500">500+ Cases</option>
                  <option value="250">250+ Cases</option>
                  <option value="100">100+ Cases</option>
                </select>
              </div>

              {/* Pricing Type Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block font-semibold text-[#0c0c0c] mb-2">
                  Pricing Type
                </label>
                <select
                  value={filters.pricingType}
                  onChange={(e) =>
                    handleFilterChange("pricingType", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  <option value="all">All Types</option>
                  <option value="hourly">Hourly Rate</option>
                  <option value="fixed">Fixed Fee</option>
                  <option value="contingency">Contingency</option>
                </select>
              </div>

              {/* Maximum Rate Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block font-semibold text-[#0c0c0c] mb-2">
                  Maximum Rate (PKR)
                </label>
                <input
                  type="number"
                  value={filters.maxRate}
                  onChange={(e) =>
                    handleFilterChange("maxRate", parseInt(e.target.value))
                  }
                  placeholder="Enter maximum rate"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Maximum Retainer Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block font-semibold text-[#0c0c0c] mb-2">
                  Maximum Retainer (PKR)
                </label>
                <input
                  type="number"
                  value={filters.maxRetainer}
                  onChange={(e) =>
                    handleFilterChange("maxRetainer", parseInt(e.target.value))
                  }
                  placeholder="Enter maximum retainer"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Free Consultation Filter */}
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.freeConsultation}
                    onChange={(e) =>
                      handleFilterChange("freeConsultation", e.target.checked)
                    }
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span>Free Consultation</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.paymentPlans}
                    onChange={(e) =>
                      handleFilterChange("paymentPlans", e.target.checked)
                    }
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span>Payment Plans</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Law Firms Section */}
        <div className="container mx-auto px-16 py-6 ">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold text-gray-500">
              {filteredFirms.length} Law Firms Found
            </h2>
            <div className="flex items-center gap-4 text-xs">
              <span className=" text-[#0c0c0c]/60">Sort by:</span>
              <select
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  const sorted = [...filteredFirms].sort((a, b) => {
                    if (order === "asc") {
                      return a[field] > b[field] ? 1 : -1;
                    }
                    return a[field] < b[field] ? 1 : -1;
                  });
                  setFilteredFirms(sorted);
                }}
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600"
              >
                <option value="rating-desc">Rating (High to Low)</option>
                <option value="rating-asc">Rating (Low to High)</option>
                <option value="successRate-desc">
                  Success Rate (High to Low)
                </option>
                <option value="successRate-asc">
                  Success Rate (Low to High)
                </option>
                <option value="casesHandled-desc">
                  Cases Handled (High to Low)
                </option>
                <option value="casesHandled-asc">
                  Cases Handled (Low to High)
                </option>
              </select>
            </div>
          </div>

          {filteredFirms.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredFirms.map((firm) => (
                <div
                  key={firm.id}
                  className="bg-white rounded-lg overflow-hidden"
                >
                  <div className="h-48 overflow-hidden rounded-xl relative">
                    <img
                      src="/bannar.svg"
                      alt={firm.name}
                      className="w-full h-full object-cover "
                    />
                    <div className="absolute top-1 left-2">
                      <span className="bg-[#122349] text-[#1dbf73] font-semibold text-[10px] px-2 py-1 rounded-md">
                        New Firm
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex justify-start items-center space-x-4">
                        <img
                          src="/"
                          alt=""
                          className="size-12 rounded-full bg-gray-300"
                        />
                        <div>
                          <h3
                            onClick={() => handleContactClick(firm)}
                            className="text-md font-bold transition-colors mb-1"
                          >
                            {firm.name}
                          </h3>
                          <h3
                            onClick={() => handleContactClick(firm)}
                            className="text-[#2779F6] text-xs hover:underline cursor-pointer transition-colors"
                          >
                            {firm.name}
                          </h3>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <div className="flex items-center">
                          <i className="ri-star-fill text-amber-400 mr-1"></i>
                          <span className="font-semibold">
                            {firm.rating}
                          </span>{" "}
                          {/* <span className="font-semibold">{firm.reviews}</span> */}
                        </div>
                        <span className="text-xs text-gray-500"> (0)</span>
                      </div>
                    </div>
                    <p className="text-[#0c0c0c]/70 text-sm mb-2">
                      {firm.description}
                    </p>
                    <div className="flex items-center text-[13px] text-[#0c0c0c]/60 mb-2">
                      <i className="ri-map-pin-line mr-1"></i>
                      <span>{firm.location}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-2">
                      <div>
                        <span className="font-semibold">
                          {firm.casesHandled}
                        </span>{" "}
                        cases
                      </div>
                      <div>
                        <span className="font-semibold">
                          {firm.successRate}
                        </span>{" "}
                        success rate
                      </div>
                    </div>
                    <div className="flex justify-between items-center my-2">
                      <h4 className="text-sm font-semibold uppercase text-[#0c0c0c]/80">
                        form
                        <span>
                          <span className="text-xs mx-0.5">
                            {filters.country === "pakistan" ? "PKR" : "$"}
                          </span>
                          <span className="font-bold mr-0.5 text-[15px]">
                            0
                          </span>
                          <span className="text-xs">per case</span>
                        </span>
                        {/* {firm.pricing.type === "hourly" ? "/hour" : ""} */}
                      </h4>
                      {/* <div className="space-y-2">
                      {firm.pricing.type === "hourly" && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[#0c0c0c]/60">
                            Hourly Rate:
                          </span>
                          <span className="font-semibold">
                            {filters.country === "pakistan" ? "PKR " : "$"}
                            {firm.pricing.rate.toLocaleString()}
                            {firm.pricing.type === "hourly" ? "/hour" : ""}
                          </span>
                        </div>
                      )}
                      {firm.pricing.type === "fixed" && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[#0c0c0c]/60">Fixed Fee:</span>
                          <span className="font-semibold">
                            {filters.country === "pakistan" ? "PKR " : "$"}
                            {firm.pricing.rate.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {firm.pricing.type === "contingency" && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[#0c0c0c]/60">
                            Contingency Fee:
                          </span>
                          <span className="font-semibold">
                            {firm.pricing.percentage}%
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-[#0c0c0c]/60">
                          Minimum Retainer:
                        </span>
                        <span className="font-semibold">
                          {filters.country === "pakistan" ? "PKR " : "$"}
                          {firm.pricing.minRetainer.toLocaleString()}
                        </span>
                      </div>
                    </div> */}
                      {firm.pricing.freeConsultation && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-1 rounded">
                          Free Consultation
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold mb-2">
                        Specialties:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {firm.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="bg-[#dededa] text-[#0c0c0c] text-[10px] px-2 py-1 rounded"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* <button
                                      onClick={() => handleContactClick(firm)}

                    className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Contact Firm
                  </button> */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-lg text-[#0c0c0c]/70">
                No law firms found matching your criteria.
              </p>
            </div>
          )}
        </div>

        {/* Contact Modal */}
        {showContactModal && selectedFirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">{selectedFirm.name}</h3>
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="text-white hover:text-gray-200"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <i className="ri-map-pin-line text-emerald-600 mt-1 mr-3"></i>
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-gray-600">{selectedFirm.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <i className="ri-phone-line text-emerald-600 mt-1 mr-3"></i>
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-gray-600">+92 300 1234567</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <i className="ri-mail-line text-emerald-600 mt-1 mr-3"></i>
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-gray-600">
                          contact@
                          {selectedFirm.name.toLowerCase().replace(/\s+/g, "")}
                          .com
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <i className="ri-global-line text-emerald-600 mt-1 mr-3"></i>
                      <div>
                        <p className="font-medium">Website</p>
                        <p className="text-gray-600">
                          www.
                          {selectedFirm.name.toLowerCase().replace(/\s+/g, "")}
                          .com
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3">Business Hours</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedFirm.businessHours ? (
                      // Display business hours from registered firm
                      <>
                        <div>
                          <p className="font-medium">Monday</p>
                          <p className="text-gray-600">
                            {selectedFirm.businessHours.monday?.closed
                              ? "Closed"
                              : `${
                                  selectedFirm.businessHours.monday?.open ||
                                  "9:00 AM"
                                } - ${
                                  selectedFirm.businessHours.monday?.close ||
                                  "6:00 PM"
                                }`}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Tuesday</p>
                          <p className="text-gray-600">
                            {selectedFirm.businessHours.tuesday?.closed
                              ? "Closed"
                              : `${
                                  selectedFirm.businessHours.tuesday?.open ||
                                  "9:00 AM"
                                } - ${
                                  selectedFirm.businessHours.tuesday?.close ||
                                  "6:00 PM"
                                }`}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Wednesday</p>
                          <p className="text-gray-600">
                            {selectedFirm.businessHours.wednesday?.closed
                              ? "Closed"
                              : `${
                                  selectedFirm.businessHours.wednesday?.open ||
                                  "9:00 AM"
                                } - ${
                                  selectedFirm.businessHours.wednesday?.close ||
                                  "6:00 PM"
                                }`}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Thursday</p>
                          <p className="text-gray-600">
                            {selectedFirm.businessHours.thursday?.closed
                              ? "Closed"
                              : `${
                                  selectedFirm.businessHours.thursday?.open ||
                                  "9:00 AM"
                                } - ${
                                  selectedFirm.businessHours.thursday?.close ||
                                  "6:00 PM"
                                }`}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Friday</p>
                          <p className="text-gray-600">
                            {selectedFirm.businessHours.friday?.closed
                              ? "Closed"
                              : `${
                                  selectedFirm.businessHours.friday?.open ||
                                  "9:00 AM"
                                } - ${
                                  selectedFirm.businessHours.friday?.close ||
                                  "6:00 PM"
                                }`}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Saturday</p>
                          <p className="text-gray-600">
                            {selectedFirm.businessHours.saturday?.closed
                              ? "Closed"
                              : `${
                                  selectedFirm.businessHours.saturday?.open ||
                                  "10:00 AM"
                                } - ${
                                  selectedFirm.businessHours.saturday?.close ||
                                  "2:00 PM"
                                }`}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Sunday</p>
                          <p className="text-gray-600">
                            {selectedFirm.businessHours.sunday?.closed
                              ? "Closed"
                              : `${
                                  selectedFirm.businessHours.sunday?.open ||
                                  "Closed"
                                } - ${
                                  selectedFirm.businessHours.sunday?.close || ""
                                }`}
                          </p>
                        </div>
                      </>
                    ) : (
                      // Default business hours for mock data
                      <>
                        <div>
                          <p className="font-medium">Monday - Friday</p>
                          <p className="text-gray-600">9:00 AM - 6:00 PM</p>
                        </div>
                        <div>
                          <p className="font-medium">Saturday</p>
                          <p className="text-gray-600">10:00 AM - 2:00 PM</p>
                        </div>
                        <div>
                          <p className="font-medium">Sunday</p>
                          <p className="text-gray-600">Closed</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* <div className="pt-4 border-t border-gray-200">
                <div className="flex gap-3 justify-between">
                  <button
                    onClick={() => {
                      // Open email client
                      window.location.href = `mailto:contact@${selectedFirm.name
                        .toLowerCase()
                        .replace(/\s+/g, "")}.com`;
                    }}
                    className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <i className="ri-mail-send-line"></i> Email
                  </button>
                  <button
                    onClick={() => {
                      // Simulating a call - in a real app this would use tel: protocol
                      alert(
                        "In a real app, this would initiate a call to the firm."
                      );
                    }}
                    className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                  >
                    <i className="ri-phone-line"></i> Call Now
                  </button>
                </div>
              </div>
               */}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
