import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import * as firmsData from "../superadmin/firmsData";
import { gsap } from "gsap";

// Fallback service data when everything else fails
const getFallbackServices = () => {
  return [
    {
      slug: "legal-assistance",
      name: "Legal Assistance",
      count: 5,
    },
    {
      slug: "case-summarization",
      name: "Case Summarization",
      count: 3,
    },
    {
      slug: "contract-review",
      name: "Contract Review",
      count: 4,
    },
    {
      slug: "legal-research",
      name: "Legal Research",
      count: 2,
    },
    {
      slug: "document-analysis",
      name: "Document Analysis",
      count: 3,
    },
  ];
};

// Common specialties for fallback
const COMMON_SPECIALTIES = [
  "Corporate Law",
  "Family Law",
  "Criminal Defense",
  "Civil Litigation",
  "Intellectual Property",
  "Real Estate Law",
  "Tax Law",
  "Immigration Law",
];

export default function Hero() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const itemRefs = useRef([]);

  // GSAP animation refs
  const heroRef = useRef(null);
  const headlineRef = useRef(null);
  const searchBoxRef = useRef(null);
  const topServicesRef = useRef(null);
  const heroBgRef = useRef(null);

  // Check for incoming state to open search
  useEffect(() => {
    if (location.state?.openSearch) {
      setShowResults(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Initialize GSAP animations
  useEffect(() => {
    // Initialize timeline
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate background with subtle zoom effect
    gsap.fromTo(
      heroBgRef.current,
      { scale: 1 },
      {
        scale: 1.05,
        duration: 30,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      }
    );

    // Animate hero elements
    tl.fromTo(
      headlineRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1 }
    )
      .fromTo(
        searchBoxRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8 },
        "-=0.6"
      )
      .fromTo(
        topServicesRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7 },
        "-=0.4"
      );

    // Add hover animations for service links
    const serviceLinks = document.querySelectorAll(".service-link");
    serviceLinks.forEach((link) => {
      link.addEventListener("mouseenter", () => {
        gsap.to(link, {
          scale: 1.05,
          duration: 0.2,
          backgroundColor: "#059669",
        });
      });
      link.addEventListener("mouseleave", () => {
        gsap.to(link, {
          scale: 1,
          duration: 0.2,
          backgroundColor: "transparent",
        });
      });
    });

    return () => {
      // Cleanup animation
      tl.kill();
      // Remove event listeners
      serviceLinks.forEach((link) => {
        link.removeEventListener("mouseenter", () => {});
        link.removeEventListener("mouseleave", () => {});
      });
    };
  }, []);

  // Services data from servicesData object in Services.jsx
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
      description:
        "Analysis of legal documents and identification of key issues",
      icon: "ri-file-search-line",
    },
  };

  // Function to safely load and refresh top services
  const loadTopServices = () => {
    try {
      console.log("Loading top services...");

      // Make sure firm data is initialized
      firmsData.initializeFirmData();

      // Force refresh services data
      firmsData.updateServicesData();

      // Get all available services and count the firms offering each service
      const approvedFirms = firmsData.getFirmsByStatus("approved") || [];
      const serviceCountMap = {};

      // Count firms offering each service
      approvedFirms.forEach((firm) => {
        (firm.services || []).forEach((service) => {
          if (!serviceCountMap[service]) {
            serviceCountMap[service] = 0;
          }
          serviceCountMap[service]++;
        });
      });

      // Convert to array and sort by popularity
      const serviceArray = Object.entries(serviceCountMap)
        .filter(([serviceSlug]) => servicesData[serviceSlug]) // Only include known services
        .map(([serviceSlug, count]) => ({
          slug: serviceSlug,
          name:
            servicesData[serviceSlug]?.name ||
            serviceSlug
              .replace(/-/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
          count: count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Get top 5 services

      // If no services found, use fallback data
      if (serviceArray.length === 0) {
        setTopServices(getFallbackServices());
      } else {
        setTopServices(serviceArray);
      }
    } catch (err) {
      console.error("Error loading top services:", err);
      setError(err.message);
      // Use fallback data in case of error
      setTopServices(getFallbackServices());
    }
  };

  // Initialize data and fetch top services on component mount
  useEffect(() => {
    // Initial load with error handling
    try {
      loadTopServices();

      // Set up a periodic refresh (every 30 seconds)
      const refreshInterval = setInterval(() => {
        loadTopServices();
      }, 30000);

      // Clean up interval on unmount
      return () => clearInterval(refreshInterval);
    } catch (err) {
      console.error("Error in top services interval:", err);
      setError(err.message);
      // Use fallback data when interval setup fails
      setTopServices(getFallbackServices());
    }
  }, []);

  // Perform search on input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      setSearchResults([]);
      setShowResults(false);
      setHighlightedIndex(-1);
      return;
    }

    try {
      const searchValue = value.toLowerCase().trim();
      let results = [];

      // First, try to get real data
      try {
        // Get all services data
        const servicesFirmsData = firmsData.getServicesFirms() || {};

        // Search by service name
        Object.entries(servicesData).forEach(([slug, service]) => {
          if (service.name.toLowerCase().includes(searchValue)) {
            results.push({
              id: service.id,
              name: service.name,
              slug: slug,
              type: "service",
              count: servicesFirmsData[slug]?.length || 0,
            });
          }
        });

        // Try to get specialties data
        try {
          const approvedFirms = firmsData.getFirmsByStatus("approved") || [];
          const matchingSpecialties = new Set();

          // Find matching specialties
          approvedFirms.forEach((firm) => {
            (firm.specialties || []).forEach((specialty) => {
              if (
                specialty.toLowerCase().includes(searchValue) ||
                searchValue
                  .split(" ")
                  .some(
                    (term) =>
                      term.length > 2 &&
                      specialty.toLowerCase().includes(term.toLowerCase())
                  )
              ) {
                matchingSpecialties.add(specialty);
              }
            });
          });

          // Add specialties to results
          matchingSpecialties.forEach((specialty) => {
            const count = approvedFirms.filter((firm) =>
              (firm.specialties || []).includes(specialty)
            ).length;

            results.push({
              id: `specialty-${specialty.replace(/\s+/g, "-").toLowerCase()}`,
              name: specialty,
              slug: `specialty/${specialty.replace(/\s+/g, "-").toLowerCase()}`,
              type: "specialty",
              count: count,
            });
          });
        } catch (specialtyError) {
          console.error("Error searching specialties:", specialtyError);
        }
      } catch (dataError) {
        console.error("Error accessing firm data:", dataError);
        results = []; // Reset results as we'll use fallbacks
      }

      // If no results, add fallback data
      if (results.length === 0) {
        // Add matching services from fallback
        getFallbackServices()
          .filter((service) => service.name.toLowerCase().includes(searchValue))
          .forEach((service) => {
            results.push({
              id: `fallback-${service.slug}`,
              name: service.name,
              slug: service.slug,
              type: "service",
              count: service.count,
            });
          });

        // Add matching specialties from common list
        COMMON_SPECIALTIES.filter((specialty) =>
          specialty.toLowerCase().includes(searchValue)
        ).forEach((specialty) => {
          results.push({
            id: `fallback-specialty-${specialty
              .replace(/\s+/g, "-")
              .toLowerCase()}`,
            name: specialty,
            slug: `specialty/${specialty.replace(/\s+/g, "-").toLowerCase()}`,
            type: "specialty",
            count: Math.floor(Math.random() * 5) + 1,
          });
        });
      }

      // Sort results by relevance
      results.sort((a, b) => {
        const aExact = a.name.toLowerCase() === searchValue;
        const bExact = b.name.toLowerCase() === searchValue;

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        return b.count - a.count;
      });

      setSearchResults(results);
      setShowResults(true);
      setHighlightedIndex(results.length > 0 ? 0 : -1);
    } catch (err) {
      console.error("Error in search function:", err);
      setError(err.message);
      setSearchResults([]);
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (searchTerm.trim() === "") {
      setShowResults(false);
      return;
    }

    // If the search button is clicked, navigate to the highlighted result
    // or the first result if there's no highlighted item
    if (searchResults.length > 0) {
      const resultToUse =
        highlightedIndex >= 0
          ? searchResults[highlightedIndex]
          : searchResults[0];

      handleResultClick(resultToUse);
    }
  };

  // Animate search results when shown
  useEffect(() => {
    if (showResults && dropdownRef.current) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [showResults]);

  // Handle key press in search input
  const handleKeyDown = (e) => {
    if (!showResults || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex =
        highlightedIndex < searchResults.length - 1 ? highlightedIndex + 1 : 0;
      setHighlightedIndex(newIndex);
      scrollIntoView(newIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex =
        highlightedIndex > 0 ? highlightedIndex - 1 : searchResults.length - 1;
      setHighlightedIndex(newIndex);
      scrollIntoView(newIndex);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
        handleResultClick(searchResults[highlightedIndex]);
      } else if (searchResults.length > 0) {
        handleResultClick(searchResults[0]);
      }
    }
  };

  // Function to scroll the highlighted item into view
  const scrollIntoView = (index) => {
    if (itemRefs.current[index] && dropdownRef.current) {
      const container = dropdownRef.current;
      const item = itemRefs.current[index];

      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      // Check if the item is outside the visible area of the container
      if (itemRect.bottom > containerRect.bottom) {
        // If the item is below the visible area, scroll down
        container.scrollTop += itemRect.bottom - containerRect.bottom;
      } else if (itemRect.top < containerRect.top) {
        // If the item is above the visible area, scroll up
        container.scrollTop -= containerRect.top - itemRect.top;
      }
    }
  };

  // Handle result click
  const handleResultClick = (result) => {
    if (result.type === "service") {
      navigate(`/services/${result.slug}`);
    } else if (result.type === "specialty") {
      // For specialties, navigate to specialty URL pattern
      navigate(
        `/services/specialty/${result.name.replace(/\s+/g, "-").toLowerCase()}`
      );
    }

    setShowResults(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  // Handle top service click
  const handleTopServiceClick = (service) => {
    navigate(`/services/${service.slug}`);
  };

  // If there's an error, display a simplified fallback UI
  if (error) {
    return (
      <>
        <div className="bg-[#dededa] w-full h-dvh">
          <Header />
          <div className="h-[calc(100vh-65px)] w-full flex justify-center items-center">
            <div className="bg-white p-8 max-w-xl rounded-md shadow-md">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Something went wrong
              </h2>
              <p className="mb-4">
                We couldn't load the services data. Please try again later.
              </p>
              <button
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="bg-[#dededa] w-full h-[calc(100vh-56px)] mt-14">
      <Header />
      <div
        className="h-[calc(100vh-56px)] w-full overflow-hidden"
        ref={heroRef}
      >
        <div
          className="bg-cover bg-center h-full w-full relative"
          style={{
            backgroundImage: 'url("/heroleft.png")',
          }}
          ref={heroBgRef}
        >
          <div className="w-full h-full bg-[#0c0c0c]/65 relative flex justify-start items-center">
            <div className="w-[60%] relative p-16">
              <div className="flex flex-col gap-3.5 items-center">
                <h1 className="text-6xl text-white w-full" ref={headlineRef}>
                  Our Staff <br />
                  will take it from here
                </h1>
                <div
                  className="w-full flex justify-between items-center"
                  ref={searchBoxRef}
                >
                  <input
                    type="text"
                    className="w-[80%] bg-white p-2.5 outline-none"
                    placeholder="Search for Services or Specialties..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                  <button
                    className="w-[20%] bg-emerald-600 p-2.5 text-white cursor-pointer"
                    onClick={handleSearchClick}
                  >
                    Search
                  </button>
                </div>

                {/* Search results container */}
                <div className="relative w-full">
                  {showResults && (
                    <div
                      ref={dropdownRef}
                      className="absolute top-0 left-0 right-0 bg-white w-full max-h-[225px] overflow-y-auto p-2 z-10 shadow-lg"
                    >
                      {searchResults.length > 0 ? (
                        <ul className="divide-y divide-[#0c0c0c]/10">
                          {searchResults.map((result, idx) => (
                            <li
                              key={result.id}
                              ref={(el) => (itemRefs.current[idx] = el)}
                              className={`py-2 cursor-pointer hover:bg-[#dededa] p-1.5 ${
                                idx === highlightedIndex
                                  ? "bg-emerald-100 text-emerald-700"
                                  : ""
                              }`}
                              onClick={() => handleResultClick(result)}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                            >
                              <div className="flex items-center">
                                <span className="text-sm font-medium">
                                  {result.name}
                                </span>
                                <span className="ml-2 text-xs bg-gray-200 px-1.5 py-0.5 rounded">
                                  {result.type === "service"
                                    ? "Service"
                                    : "Specialty"}
                                </span>
                                <span className="ml-auto text-xs text-gray-500">
                                  {result.count}{" "}
                                  {result.type === "service"
                                    ? "firms"
                                    : "providers"}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-3 text-[#0c0c0c]/45">
                          No results found matching your search
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Top services links */}
                <div className="w-full" ref={topServicesRef}>
                  <div className="flex flex-wrap justify-start items-center gap-3.5 text-white px-1">
                    {topServices.map((service) => (
                      <a
                        key={service.slug}
                        href={`/services/${service.slug}`}
                        className="service-link py-1 px-3 rounded-lg ring-white ring-[1.5px] text-sm hover:bg-emerald-600 transition-colors group relative"
                        onClick={(e) => {
                          e.preventDefault();
                          handleTopServiceClick(service);
                        }}
                        title={`${service.name} - ${service.count} firms offering this service`}
                      >
                        {service.name}
                      </a>
                    ))}
                    {topServices.length === 0 && (
                      <span className="text-white/50 text-sm">
                        No services available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
