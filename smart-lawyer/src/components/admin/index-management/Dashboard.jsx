import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useTokenMonitor } from "../../../hooks/useTokenMonitor";

// Feature components are rendered inside Main
import Header from "../../landing/Header";
import Aside from "./Aside";
import Main from "./Main";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useParams();

  // Add token monitoring
  const tokenStatus = useTokenMonitor(true);

  const [activeComponent, setActiveComponent] = useState("home");
  const [viewingCaseNumber, setViewingCaseNumber] = useState(null);
  // const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  // Log token status for debugging
  useEffect(() => {
    if (tokenStatus.timeRemaining > 0) {
      console.log(
        `🕐 Token status - Time remaining: ${tokenStatus.timeRemaining} minutes, Expiring: ${tokenStatus.isExpiring}`
      );
    }
  }, [tokenStatus]);

  // Check if we're using the username-based routes or the old auth routes
  const isUsernameRoute = location.pathname.startsWith("/admin/");
  const baseRoute = isUsernameRoute
    ? `/admin/${username}`
    : "/auth/admin/profile";

  // Set the active component based on the URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/home")) {
      setActiveComponent("home");
    } else if (path.includes("/cases")) {
      setActiveComponent("cases");

      // Check if there's a case number in the URL
      const caseNumberMatch = path.match(/\/cases\/([^/]+)$/);
      if (caseNumberMatch && caseNumberMatch[1]) {
        setViewingCaseNumber(caseNumberMatch[1]);
      } else {
        setViewingCaseNumber(null);
      }
    } else if (path.includes("/hearings")) {
      setActiveComponent("hearings");
    } else if (path.includes("/documents")) {
      setActiveComponent("documents");
    } else if (path.includes("/judgments")) {
      setActiveComponent("judgments");
    } else if (path.includes("/clients")) {
      setActiveComponent("clients");
    } else if (path.includes("/staff-directory")) {
      setActiveComponent("staff");
    } else if (path.includes("/add-staff")) {
      setActiveComponent("addStaff");
    } else if (path.includes("/notifications")) {
      setActiveComponent("notifications");
    } else if (path.includes("/contracts")) {
      setActiveComponent("contracts");
    } else if (path.includes("/add-agreement")) {
      setActiveComponent("addAgreement");
    } else if (path.includes("/edit-agreement")) {
      setActiveComponent("editAgreement");
    } else if (path.includes("/view-agreement")) {
      setActiveComponent("viewAgreement");
    } else if (path.includes("/billing/add")) {
      setActiveComponent("addInvoice");
    } else if (path.includes("/billing/edit")) {
      setActiveComponent("editInvoice");
    } else if (path.includes("/billing/view")) {
      setActiveComponent("viewInvoice");
    } else if (path.includes("/billing")) {
      setActiveComponent("billing");
    } else if (path.includes("/profile")) {
      setActiveComponent("profile");
    } else if (path.includes("/settings")) {
      setActiveComponent("settings");
    } else if (
      path === "/auth/admin/profile" ||
      path === `/admin/${username}`
    ) {
      setActiveComponent("home");
    }
  }, [location, username]);

  // // Handle opening the message modal
  // const handleOpenMessageModal = () => {
  //   setIsMessageModalOpen(true);
  // };

  // // Handle closing the message modal
  // const handleCloseMessageModal = () => {
  //   setIsMessageModalOpen(false);
  // };

  // Component rendering handled by Main

  // Function to navigate to component and update URL
  const navigateToComponent = (component) => {
    // if (component === "messages") {
    //   handleOpenMessageModal();
    //   return;
    // }

    setActiveComponent(component);

    if (component === "home") {
      navigate(baseRoute + "/home");
    } else if (component === "staff") {
      navigate(baseRoute + "/staff-directory");
    } else if (component === "addStaff") {
      navigate(baseRoute + "/add-staff");
    } else if (component === "addAgreement") {
      navigate(baseRoute + "/add-agreement");
    } else if (component === "editAgreement") {
      navigate(baseRoute + "/edit-agreement");
    } else if (component === "viewAgreement") {
      navigate(baseRoute + "/view-agreement");
    } else if (component === "billing") {
      navigate(baseRoute + "/billing");
    } else if (component === "addInvoice") {
      navigate(baseRoute + "/billing/add");
    } else if (component === "editInvoice") {
      navigate(baseRoute + "/billing");
    } else if (component === "viewInvoice") {
      navigate(baseRoute + "/billing");
    } else {
      navigate(`${baseRoute}/${component}`);
    }
  };

  return (
    <>
      <Header />
      <div className="bg-gray-50 h-[calc(100vh-56px)] mt-14 w-full flex">
        <Aside
          activeComponent={activeComponent}
          onNavigate={navigateToComponent}
        />
        <Main
          activeComponent={activeComponent}
          viewingCaseNumber={viewingCaseNumber}
        />
      </div>
      {/* Message Modal */}
      {/* <Messages isOpen={isMessageModalOpen} onClose={handleCloseMessageModal} /> */}
    </>
  );
}
