// Initial mock data for firm registrations
const mockFirmRegistrations = [
  {
    id: 1,
    firmName: "Justice & Associates",
    firmType: "Partnership",
    establishedYear: "1995",
    firmSize: "Medium (11-50 lawyers)",
    profileImage: null,
    description:
      "A premier law firm with over 25 years of experience in handling complex legal matters.",
    specialty: "Civil Litigation",
    secondarySpecialties: ["Corporate Law", "Family Law"],

    // Contact Info
    address: "Suite 205, Business Avenue",
    city: "Karachi",
    state: "Sindh",
    zipCode: "75600",
    country: "Pakistan",
    phone: "+92 300 1234567",
    email: "contact@justiceassociates.com",
    website: "www.justiceassociates.com",
    businessHours: {
      monday: { open: "09:00", close: "17:00" },
      tuesday: { open: "09:00", close: "17:00" },
      wednesday: { open: "09:00", close: "17:00" },
      thursday: { open: "09:00", close: "17:00" },
      friday: { open: "09:00", close: "17:00" },
      saturday: { open: "10:00", close: "14:00" },
      sunday: { open: "00:00", close: "00:00", closed: true },
    },

    // Credentials
    username: "justiceassociates",

    // Billing Info
    bankName: "Allied Bank",
    accountTitle: "Justice & Associates",
    accountNumber: "****4567",

    // Other fields
    location: "Karachi, Sindh, Pakistan",
    submittedDate: "2023-12-15",
    status: "pending",
    documentType: "businessLicense",
    specialties: ["Civil Litigation", "Corporate Law", "Family Law"],
    rating: 4.8,
    casesHandled: 1245,
    successRate: "92%",
    pricing: {
      type: "hourly",
      rate: 25000,
      minRetainer: 100000,
      freeConsultation: true,
      paymentPlans: true,
    },
    services: ["legal-assistance", "legal-research", "document-analysis"],
    image:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 2,
    firmName: "Legal Eagles LLP",
    firmType: "Limited Liability Partnership",
    establishedYear: "2005",
    firmSize: "Small (1-10 lawyers)",
    profileImage: null,
    description:
      "Specializing in high-profile cases with a track record of successful outcomes.",
    specialty: "Criminal Defense",
    secondarySpecialties: ["Personal Injury", "Employment Law"],

    // Contact Info
    address: "77 Liberty Tower, Mall Road",
    city: "Lahore",
    state: "Punjab",
    zipCode: "54000",
    country: "Pakistan",
    phone: "+92 321 9876543",
    email: "info@legaleagles.com",
    website: "www.legaleaglespk.com",
    businessHours: {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "16:30" },
      saturday: { open: "10:00", close: "15:00" },
      sunday: { open: "00:00", close: "00:00", closed: true },
    },

    // Credentials
    username: "legaleagles",

    // Billing Info
    bankName: "HBL Bank",
    accountTitle: "Legal Eagles LLP",
    accountNumber: "****8765",

    // Other fields
    location: "Lahore, Punjab, Pakistan",
    submittedDate: "2023-12-14",
    status: "approved",
    documentType: "barRegistration",
    specialties: ["Criminal Defense", "Personal Injury", "Employment Law"],
    rating: 4.7,
    casesHandled: 987,
    successRate: "89%",
    pricing: {
      type: "contingency",
      percentage: 25,
      minRetainer: 50000,
      freeConsultation: true,
      paymentPlans: true,
    },
    services: ["legal-assistance", "case-summarization", "verdict-prediction"],
    image:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 3,
    firmName: "Advocate Partners",
    firmType: "Partnership",
    establishedYear: "2010",
    firmSize: "Medium (11-50 lawyers)",
    profileImage: null,
    description:
      "Leading firm in constitutional and administrative law matters.",
    specialty: "Constitutional Law",
    secondarySpecialties: ["Administrative Law", "Public Interest Litigation"],

    // Contact Info
    address: "45 Blue Area, Justice Road",
    city: "Islamabad",
    state: "Federal Territory",
    zipCode: "44000",
    country: "Pakistan",
    phone: "+92 333 4567890",
    email: "admin@advocatepartners.com",
    website: "www.advocatepartners.pk",
    businessHours: {
      monday: { open: "08:30", close: "17:30" },
      tuesday: { open: "08:30", close: "17:30" },
      wednesday: { open: "08:30", close: "17:30" },
      thursday: { open: "08:30", close: "17:30" },
      friday: { open: "08:30", close: "15:00" },
      saturday: { open: "09:00", close: "13:00" },
      sunday: { open: "00:00", close: "00:00", closed: true },
    },

    // Credentials
    username: "advocatepartners",

    // Billing Info
    bankName: "UBL Bank",
    accountTitle: "Advocate Partners",
    accountNumber: "****3456",

    // Other fields
    location: "Islamabad, Federal Territory, Pakistan",
    submittedDate: "2023-12-13",
    status: "rejected",
    documentType: "taxCertificate",
    specialties: [
      "Constitutional Law",
      "Administrative Law",
      "Public Interest Litigation",
    ],
    rating: 4.8,
    casesHandled: 1560,
    successRate: "93%",
    pricing: {
      type: "hourly",
      rate: 30000,
      minRetainer: 150000,
      freeConsultation: false,
      paymentPlans: true,
    },
    services: [
      "contract-review",
      "legal-research",
      "document-analysis",
      "case-summarization",
    ],
    image:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 4,
    firmName: "Law Experts Group",
    firmType: "Professional Corporation",
    establishedYear: "2008",
    firmSize: "Small (1-10 lawyers)",
    profileImage: null,
    description:
      "Experienced firm handling criminal and family law cases in Khyber Pakhtunkhwa.",
    specialty: "Criminal Law",
    secondarySpecialties: ["Family Law", "Property Disputes"],

    // Contact Info
    address: "123 University Road",
    city: "Peshawar",
    state: "Khyber Pakhtunkhwa",
    zipCode: "25000",
    country: "Pakistan",
    phone: "+92 345 7890123",
    email: "info@lawexperts.com",
    website: "www.lawexpertspk.com",
    businessHours: {
      monday: { open: "09:00", close: "17:00" },
      tuesday: { open: "09:00", close: "17:00" },
      wednesday: { open: "09:00", close: "17:00" },
      thursday: { open: "09:00", close: "17:00" },
      friday: { open: "09:00", close: "13:00" },
      saturday: { open: "10:00", close: "15:00" },
      sunday: { open: "00:00", close: "00:00", closed: true },
    },

    // Credentials
    username: "lawexperts",

    // Billing Info
    bankName: "MCB Bank",
    accountTitle: "Law Experts Group",
    accountNumber: "****7890",

    // Other fields
    location: "Peshawar, Khyber Pakhtunkhwa, Pakistan",
    submittedDate: "2023-12-12",
    status: "pending",
    documentType: "incorporationCertificate",
    specialties: ["Criminal Law", "Family Law", "Property Disputes"],
    rating: 4.6,
    casesHandled: 1250,
    successRate: "90%",
    pricing: {
      type: "contingency",
      percentage: 25,
      minRetainer: 25000,
      freeConsultation: true,
      paymentPlans: true,
    },
    services: [
      "case-classification",
      "legal-assistance",
      "cross-examination",
      "document-analysis",
    ],
    image:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 5,
    firmName: "Legal Solutions Inc.",
    firmType: "Private Limited Company",
    establishedYear: "2012",
    firmSize: "Small (1-10 lawyers)",
    profileImage: null,
    description:
      "A boutique firm known for innovative legal solutions and personalized client service.",
    specialty: "Intellectual Property",
    secondarySpecialties: ["Real Estate", "Tax Law"],

    // Contact Info
    address: "32 Jinnah Road",
    city: "Quetta",
    state: "Balochistan",
    zipCode: "87300",
    country: "Pakistan",
    phone: "+92 312 3456789",
    email: "hello@legalsolutions.com",
    website: "www.legalsolutionspk.com",
    businessHours: {
      monday: { open: "09:30", close: "17:30" },
      tuesday: { open: "09:30", close: "17:30" },
      wednesday: { open: "09:30", close: "17:30" },
      thursday: { open: "09:30", close: "17:30" },
      friday: { open: "09:30", close: "13:30" },
      saturday: { open: "10:30", close: "14:30" },
      sunday: { open: "00:00", close: "00:00", closed: true },
    },

    // Credentials
    username: "legalsolutions",

    // Billing Info
    bankName: "Bank Alfalah",
    accountTitle: "Legal Solutions Inc.",
    accountNumber: "****1234",

    // Other fields
    location: "Quetta, Balochistan, Pakistan",
    submittedDate: "2023-12-10",
    status: "pending",
    documentType: "practicePermit",
    specialties: ["Intellectual Property", "Real Estate", "Tax Law"],
    rating: 4.9,
    casesHandled: 1567,
    successRate: "94%",
    pricing: {
      type: "fixed",
      rate: 150000,
      minRetainer: 50000,
      freeConsultation: true,
      paymentPlans: true,
    },
    services: ["template-generation", "contract-review", "legal-research"],
    image:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop",
  },
];

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const testKey = "__test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn("localStorage is not available:", e);
    return false;
  }
};

// In-memory fallback when localStorage is not available
let inMemoryStore = {
  registeredFirms: null,
  lawFirmsData: null,
};

/**
 * Initialize the firm data in localStorage if not already present
 */
export const initializeFirmData = () => {
  try {
    // Check if localStorage is available
    if (isLocalStorageAvailable()) {
      // Check if firms data exists in localStorage
      if (!localStorage.getItem("registeredFirms")) {
        localStorage.setItem(
          "registeredFirms",
          JSON.stringify(mockFirmRegistrations)
        );
      }

      // Initialize lawFirmsData if needed
      if (!localStorage.getItem("lawFirmsData")) {
        // Use the updateServicesData helper to populate the services data
        updateServicesData();
      }
    } else {
      // Use in-memory fallback
      if (!inMemoryStore.registeredFirms) {
        inMemoryStore.registeredFirms = mockFirmRegistrations;
      }

      if (!inMemoryStore.lawFirmsData) {
        // This will update inMemoryStore.lawFirmsData
        updateServicesData();
      }
    }
  } catch (error) {
    console.error("Error initializing firm data:", error);
    // Use in-memory fallback as last resort
    inMemoryStore.registeredFirms = mockFirmRegistrations;
    updateServicesData();
  }
};

/**
 * Get all registered firms
 * @returns {Array} Array of firm objects
 */
export const getAllFirms = () => {
  try {
    initializeFirmData();

    if (isLocalStorageAvailable()) {
      return JSON.parse(localStorage.getItem("registeredFirms") || "[]");
    } else {
      return inMemoryStore.registeredFirms || [];
    }
  } catch (error) {
    console.error("Error getting all firms:", error);
    return inMemoryStore.registeredFirms || [];
  }
};

/**
 * Get firms filtered by status
 * @param {string} status - The status to filter by (pending, approved, rejected)
 * @returns {Array} Filtered array of firm objects
 */
export const getFirmsByStatus = (status) => {
  try {
    const firms = getAllFirms();
    if (status === "all") {
      return firms;
    }
    return firms.filter((firm) => firm.status === status);
  } catch (error) {
    console.error(`Error getting firms by status "${status}":`, error);
    return [];
  }
};

/**
 * Get firm by ID
 * @param {number|string} id - The firm ID
 * @returns {Object|null} The firm object or null if not found
 */
export const getFirmById = (id) => {
  try {
    const firms = getAllFirms();
    return firms.find((firm) => firm.id === id) || null;
  } catch (error) {
    console.error(`Error getting firm by ID "${id}":`, error);
    return null;
  }
};

/**
 * Get all services categorized by firm
 * @returns {Object} Object with service keys and arrays of firms
 */
export const getServicesFirms = () => {
  try {
    initializeFirmData();

    if (isLocalStorageAvailable()) {
      return JSON.parse(localStorage.getItem("lawFirmsData") || "{}");
    } else {
      return inMemoryStore.lawFirmsData || {};
    }
  } catch (error) {
    console.error("Error getting services firms:", error);
    return inMemoryStore.lawFirmsData || {};
  }
};

/**
 * Search firms by name, location, or email, and optionally filter by status
 * @param {string} searchTerm - The search term
 * @param {string} statusFilter - Filter by status (all, pending, approved, rejected)
 * @param {Object} advancedFilters - Optional advanced filters object
 * @returns {Array} Filtered array of firm objects
 */
export const searchFirms = (searchTerm, statusFilter, advancedFilters = {}) => {
  // Get firms filtered by status first
  let firms = getFirmsByStatus(statusFilter === "all" ? "all" : statusFilter);

  // Apply search term if provided
  if (searchTerm && searchTerm.trim() !== "") {
    const term = searchTerm.toLowerCase().trim();
    firms = firms.filter(
      (firm) =>
        (firm.firmName && firm.firmName.toLowerCase().includes(term)) ||
        (firm.location && firm.location.toLowerCase().includes(term)) ||
        (firm.email && firm.email.toLowerCase().includes(term))
    );
  }

  // Apply advanced filters if provided
  if (advancedFilters) {
    // Filter by specialties
    if (advancedFilters.specialties && advancedFilters.specialties.length > 0) {
      firms = firms.filter((firm) =>
        advancedFilters.specialties.some((specialty) =>
          (firm.specialties || []).includes(specialty)
        )
      );
    }

    // Filter by minimum rating
    if (advancedFilters.minRating) {
      firms = firms.filter((firm) => firm.rating >= advancedFilters.minRating);
    }

    // Filter by pricing type
    if (advancedFilters.pricingType) {
      firms = firms.filter(
        (firm) => firm.pricing?.type === advancedFilters.pricingType
      );
    }

    // Filter by location
    if (advancedFilters.location) {
      const locationTerm = advancedFilters.location.toLowerCase();
      firms = firms.filter(
        (firm) =>
          firm.location && firm.location.toLowerCase().includes(locationTerm)
      );
    }
  }

  return firms;
};

/**
 * Get statistics about registered firms
 * @returns {Object} Object with counts for total, pending, approved, and rejected firms
 */
export const getFirmStatistics = () => {
  const firms = getAllFirms();
  return {
    total: firms.length,
    pending: firms.filter((firm) => firm.status === "pending").length,
    approved: firms.filter((firm) => firm.status === "approved").length,
    rejected: firms.filter((firm) => firm.status === "rejected").length,
  };
};

/**
 * Change the status of a firm
 * @param {number|string} firmId - The firm ID
 * @param {string} newStatus - The new status (pending, approved, rejected)
 * @returns {boolean} Success flag
 */
export const changeFirmStatus = (firmId, newStatus) => {
  try {
    // Get all firms
    const firms = getAllFirms();

    // Find the firm to update
    const firmIndex = firms.findIndex((f) => f.id === firmId);

    if (firmIndex === -1) {
      return false;
    }

    // Update the status
    firms[firmIndex].status = newStatus;

    // Save to localStorage or memory
    if (isLocalStorageAvailable()) {
      localStorage.setItem("registeredFirms", JSON.stringify(firms));
    } else {
      inMemoryStore.registeredFirms = firms;
    }

    // Update service data if status changed to/from approved
    updateServicesData();

    return true;
  } catch (error) {
    console.error(`Error changing firm status for ID "${firmId}":`, error);
    return false;
  }
};

/**
 * Reset data to original mock data
 * @returns {boolean} Success flag
 */
export const resetToMockData = () => {
  try {
    // Reset registered firms
    if (isLocalStorageAvailable()) {
      localStorage.setItem(
        "registeredFirms",
        JSON.stringify(mockFirmRegistrations)
      );
    } else {
      inMemoryStore.registeredFirms = mockFirmRegistrations;
    }

    // Update services data
    updateServicesData();

    return true;
  } catch (error) {
    console.error("Error resetting to mock data:", error);
    inMemoryStore.registeredFirms = mockFirmRegistrations;
    updateServicesData();
    return false;
  }
};

/**
 * Update the services data based on current approved firms
 * This should be called whenever firms are added, removed, or status changed
 */
export const updateServicesData = () => {
  try {
    // Get all approved firms
    const approvedFirms = getFirmsByStatus("approved");

    // Create new services data structure
    const lawFirmsData = {};

    // Populate with service categories from approved firms
    approvedFirms.forEach((firm) => {
      // Add to relevant service categories
      (firm.services || []).forEach((service) => {
        if (!lawFirmsData[service]) {
          lawFirmsData[service] = [];
        }

        lawFirmsData[service].push({
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
        });
      });

      // Also add to pakistani-firms category
      if (!lawFirmsData["pakistani-firms"]) {
        lawFirmsData["pakistani-firms"] = [];
      }

      lawFirmsData["pakistani-firms"].push({
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
      });
    });

    // Save to localStorage or memory
    if (isLocalStorageAvailable()) {
      localStorage.setItem("lawFirmsData", JSON.stringify(lawFirmsData));
    } else {
      inMemoryStore.lawFirmsData = lawFirmsData;
    }
  } catch (error) {
    console.error("Error updating services data:", error);
    // Create some minimal data even in case of error
    inMemoryStore.lawFirmsData = {};
  }
};

/**
 * Add a new firm registration
 * @param {Object} firmData - The firm data to add
 * @returns {boolean} Success flag
 */
export const addNewFirm = (firmData) => {
  try {
    // Get existing firms
    const firms = getAllFirms();

    // Generate a new ID (max existing ID + 1)
    const newId = Math.max(...firms.map((f) => f.id), 0) + 1;

    // Create new firm object with required fields
    const newFirm = {
      id: newId,
      ...firmData,
      status: "pending",
      submittedDate: new Date().toISOString().split("T")[0],
    };

    // Add to firms array
    firms.push(newFirm);

    // Save to localStorage or memory
    if (isLocalStorageAvailable()) {
      localStorage.setItem("registeredFirms", JSON.stringify(firms));
    } else {
      inMemoryStore.registeredFirms = firms;
    }

    // Update services data
    updateServicesData();

    return true;
  } catch (error) {
    console.error("Error adding new firm:", error);
    return false;
  }
};
