import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
//The store.js file initializes and exports the Redux store with the authentication and user slices.
// import { UserAuthAPI } from "../services/UserAuthAPI";
import { AdminAuthAPI } from "../services/AdminAuthAPI";
import { AdminRegistrationAPI } from "../services/RegistrationAPI"; // Renamed from RegistrationAPI
import { clientRegistrationAPI } from "../services/ClientRegistrationAPI"; // New Client Registration API
import { clientAuthAPI } from "../services/ClientAuthAPI"; // New Client Auth API
import { ClassificationAPI } from "../services/ClassificationAPI";
import { SummarizationAPI } from "../services/SummarizationAPI";
import { VerdictPredictionAPI } from "../services/VerdictPredictionAPI";
import { ChatbotAPI } from "../services/ChatbotAPI";
import { caseManagementAPI } from "../services/CaseManagementAPI"; // Case Management API
import { hearingsManagementAPI } from "../services/HearingsManagementAPI"; // Hearings Management API
import judgmentsAPI from "../services/JudgmentsAPI";
import { documentsAPI } from "../services/DocumentsAPI";
import { ClientsAPI } from "../services/ClientsAPI";
import { StaffAPI } from "../services/StaffAPI";
import AgreementsAPI from "../services/AgreementsAPI";
import InvoicesAPI from "../services/InvoicesAPI";
import { PermissionsAPI } from "../services/PermissionsAPI";
import { RentalAgreementAPI } from "../services/RentalAgreementAPI";

import authReducer from "../features/authSlice"; // ✅ FIXED: Import auth slice
// import { userReducer } from "../features/userSlice";

export const store = configureStore({
  reducer: {
    // [UserAuthAPI.reducerPath]: UserAuthAPI.reducer,
    [AdminAuthAPI.reducerPath]: AdminAuthAPI.reducer,
    [AdminRegistrationAPI.reducerPath]: AdminRegistrationAPI.reducer, // Admin Registration
    [clientRegistrationAPI.reducerPath]: clientRegistrationAPI.reducer, // Client Registration
    [clientAuthAPI.reducerPath]: clientAuthAPI.reducer, // Client Authentication
    [ClassificationAPI.reducerPath]: ClassificationAPI.reducer,
    [SummarizationAPI.reducerPath]: SummarizationAPI.reducer,
    [VerdictPredictionAPI.reducerPath]: VerdictPredictionAPI.reducer,
    [ChatbotAPI.reducerPath]: ChatbotAPI.reducer,
    [caseManagementAPI.reducerPath]: caseManagementAPI.reducer, // Case Management
    [hearingsManagementAPI.reducerPath]: hearingsManagementAPI.reducer, // Hearings Management
    [judgmentsAPI.reducerPath]: judgmentsAPI.reducer,
    [documentsAPI.reducerPath]: documentsAPI.reducer,
    [ClientsAPI.reducerPath]: ClientsAPI.reducer,
    [StaffAPI.reducerPath]: StaffAPI.reducer,
    [AgreementsAPI.reducerPath]: AgreementsAPI.reducer,
    [InvoicesAPI.reducerPath]: InvoicesAPI.reducer,
    [PermissionsAPI.reducerPath]: PermissionsAPI.reducer,
    [RentalAgreementAPI.reducerPath]: RentalAgreementAPI.reducer,
    auth: authReducer, // ✅ FIXED: Auth slice registered
    // user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      // UserAuthAPI.middleware,
      AdminAuthAPI.middleware,
      AdminRegistrationAPI.middleware, // Admin Registration middleware
      clientRegistrationAPI.middleware, // Client Registration middleware
      clientAuthAPI.middleware, // Client Auth middleware
      ClassificationAPI.middleware,
      SummarizationAPI.middleware,
      VerdictPredictionAPI.middleware,
      ChatbotAPI.middleware,
      caseManagementAPI.middleware, // Case Management middleware
      hearingsManagementAPI.middleware, // Hearings Management middleware
      judgmentsAPI.middleware,
      documentsAPI.middleware,
      ClientsAPI.middleware,
      StaffAPI.middleware,
      AgreementsAPI.middleware,
      InvoicesAPI.middleware,
      PermissionsAPI.middleware,
      RentalAgreementAPI.middleware,

      // Custom middleware to handle user switching
      (store) => (next) => (action) => {
        const result = next(action);

        // If setCredentials action is dispatched, clear all API caches
        if (action.type === "auth/setCredentials") {
          console.log("🔄 setCredentials detected, clearing all API caches...");
          store.dispatch(caseManagementAPI.util.resetApiState());
          store.dispatch(hearingsManagementAPI.util.resetApiState());
          store.dispatch(judgmentsAPI.util.resetApiState());
          store.dispatch(documentsAPI.util.resetApiState());
          store.dispatch(ClientsAPI.util.resetApiState());
          store.dispatch(StaffAPI.util.resetApiState());
          store.dispatch(AgreementsAPI.util.resetApiState());
          store.dispatch(InvoicesAPI.util.resetApiState());
          store.dispatch(PermissionsAPI.util.resetApiState());
          console.log("✅ API caches cleared after credential change");
        }

        return result;
      }
    ),
});
setupListeners(store.dispatch);
