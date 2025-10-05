// Admin Registration API - For Law Firm Registration
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE } from "../../config/apiConfig";

export const AdminRegistrationAPI = createApi({
  reducerPath: "AdminRegistrationAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE + "/",
    prepareHeaders: (headers) => {
      // Set necessary headers for file uploads and CORS
      headers.set("Accept", "*/*");
      // No need to set Content-Type - fetchBaseQuery does this automatically for FormData
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Complete Admin registration endpoint
    completeAdminRegistration: builder.mutation({
      query: (formData) => {
        console.log("completeAdminRegistration received:", formData);

        // If formData is already FormData, use it directly
        if (formData instanceof FormData) {
          console.log("Using provided FormData directly");

          // Ensure array data is properly stringified
          const formDataCopy = new FormData();

          // Copy all entries, properly handling arrays
          for (let pair of formData.entries()) {
            let [key, value] = pair;

            // Normalize businessHours -> officeHours BEFORE processing
            if (key === "businessHours") {
              key = "officeHours"; // backend expects officeHours
            }

            // If this is an array-like field, ensure it's properly stringified
            if (
              key === "services" ||
              key === "specialty" ||
              key === "secondarySpecialties" ||
              key === "paymentMethods" ||
              key === "officeHours"
            ) {
              // If value is empty or null, use empty array
              if (!value || value === "null" || value === "undefined") {
                formDataCopy.append(key, JSON.stringify([]));
              }
              // If value is already a string but not JSON formatted, try to convert it
              else if (
                typeof value === "string" &&
                !(value.startsWith("[") || value.startsWith("{"))
              ) {
                try {
                  // Try parsing as JSON first (in case it's already valid JSON)
                  JSON.parse(value);
                  formDataCopy.append(key, value);
                } catch {
                  // If it fails, assume it's a comma-separated string and convert to array
                  const arrayValue = value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean);
                  formDataCopy.append(key, JSON.stringify(arrayValue));
                }
              }
              // If already an array object, stringify it
              else if (Array.isArray(value)) {
                formDataCopy.append(key, JSON.stringify(value));
              }
              // If already a string in JSON format, use it as is
              else {
                formDataCopy.append(key, value);
              }
            } else if (key === "officeHours" && typeof value === "object") {
              formDataCopy.append(key, JSON.stringify(value));
            } else {
              formDataCopy.append(key, value);
            }
          }

          // Log all entries for debugging
          console.log("FormData entries in API call:");
          for (let pair of formDataCopy.entries()) {
            console.log(`${pair[0]}: ${pair[1]}`);
          }

          return {
            url: "registration/admin/complete/",
            method: "POST",
            body: formDataCopy,
            formData: true,
          };
        }

        // Otherwise, create a new FormData object
        const newFormData = new FormData();

        // Add all fields to formData
        Object.entries(formData).forEach(([origKey, value]) => {
          let key = origKey === "businessHours" ? "officeHours" : origKey;
          if (value !== null && value !== undefined) {
            // Handle business hours
            if (key === "officeHours" && (Array.isArray(value) || typeof value === 'object')) {
              newFormData.append(key, JSON.stringify(value));
            }
            // Handle array data (services, specialty, etc.)
            else if (
              key === "services" ||
              key === "specialty" ||
              key === "secondarySpecialties" ||
              key === "paymentMethods"
            ) {
              if (Array.isArray(value)) {
                newFormData.append(key, JSON.stringify(value));
              } else if (typeof value === "string") {
                try {
                  // Try parsing as JSON first
                  JSON.parse(value);
                  newFormData.append(key, value);
                } catch {
                  // If it fails, assume it's a comma-separated string
                  const arrayValue = value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean);
                  newFormData.append(key, JSON.stringify(arrayValue));
                }
              } else {
                // Default to empty array
                newFormData.append(key, JSON.stringify([]));
              }
            }
            // Handle file uploads
            else if (
              key.includes("documentFile_") ||
              key === "cnicFront" ||
              key === "cnicBack" ||
              key === "profileImage"
            ) {
              if (value instanceof File) {
                newFormData.append(key, value);
              }
            } else if (typeof value === "boolean") {
              // Handle boolean values
              newFormData.append(key, value ? "true" : "false");
            } else {
              // Handle all other values
              newFormData.append(key, value);
            }
          }
        });

        return {
          url: "registration/admin/complete/",
          method: "POST",
          body: newFormData,
          formData: true,
        };
      },
      transformResponse: (response) => {
        // Transform the standardized API response
        console.log("API Response:", response);
        return {
          ...response,
          // Add any additional transformations here if needed
        };
      },
      transformErrorResponse: (error) => {
        console.error("API Error:", error);

        // Extract error details from our standardized error format
        if (error.data) {
          const { status, message, errors } = error.data;
          // Return a more structured error object
          return {
            status: status || "error",
            message: message || "An unexpected error occurred",
            errors: errors || [],
            timestamp: error.data.timestamp,
            originalError: error,
          };
        }

        return error;
      },
    }),

    // Get registration status by CNIC number
    getRegistrationStatus: builder.query({
      query: (cnicNumber) => `registration/status/${cnicNumber}`,
    }),

    // Get registration status by ID
    getRegistrationStatusById: builder.query({
      query: (userId) => `registration/status-by-id/${userId}`,
      transformResponse: (response) => {
        console.log("Status by ID response:", response);
        return response;
      },
    }),

    // Get all registrations for admin dashboard
    getAllRegistrations: builder.query({
      query: () => "registration/all/",
      transformResponse: (response) => {
        console.log("All registrations response:", response);
        if (!response || response.status === "error") {
          console.error(
            "Error in getAllRegistrations:",
            response?.message || "Unknown error"
          );
          return { data: { registrations: [] } };
        }
        return response;
      },
      transformErrorResponse: (error) => {
        console.error("Error fetching registrations:", error);
        return {
          status: "error",
          message: error.data?.message || "Failed to fetch registration data",
          data: { registrations: [] },
        };
      },
      providesTags: ["Registrations"],
    }),

    // Update registration status
    updateRegistrationStatus: builder.mutation({
      query: ({ registrationId, status }) => ({
        url: `registration/status-by-id/${registrationId}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Registrations"],
    }),
  }),
});

export const {
  useCompleteAdminRegistrationMutation,
  useGetRegistrationStatusQuery,
  useGetRegistrationStatusByIdQuery,
  useGetAllRegistrationsQuery,
  useUpdateRegistrationStatusMutation,
} = AdminRegistrationAPI;
