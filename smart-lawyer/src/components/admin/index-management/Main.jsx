import React from "react";

// Feature components moved here
import Home from "../self-management/Home";
import Profile from "../self-management/Profile";
import Notifications from "../self-management/Notifications";
// import Messages from "../Messages";
import IndexCase from "../case-management/IndexCase";
import IndexHearing from "../hearing-management/IndexHearing";
import IndexJudgment from "../judgment-management/IndexJudgment";
import IndexDocument from "../document-management/IndexDocument";
import IndexClient from "../client-management/IndexClient";

import IndexStaff from "../staff-management/IndexStaff";
import AddStaff from "../staff-management/AddStaff";

import IndexAgreement from "../agreement-management/IndexAgreement";
import AddAgreement from "../agreement-management/AddAgreement";
import EditAgreement from "../agreement-management/EditAgreement";
import AgreementView from "../agreement-management/AgreementView";

import IndexInvoice from "../invoice-management/IndexInvoice";
import AddInvoice from "../invoice-management/AddInvoice";
import EditInvoice from "../invoice-management/EditInvoice";
import InvoiceView from "../invoice-management/InvoiceView";

import Settings from "../settings-management/Settings";

export default function Main({ activeComponent, viewingCaseNumber }) {
  const renderComponent = () => {
    switch (activeComponent) {
      case "home":
        return <Home />;
      case "profile":
        return <Profile />;
      case "notifications":
        return <Notifications />;
      case "cases":
        return <IndexCase viewingCaseNumber={viewingCaseNumber} />;
      case "hearings":
        return <IndexHearing />;
      case "judgments":
        return <IndexJudgment />;
      case "documents":
        return <IndexDocument />;
      case "clients":
        return <IndexClient />;
      case "staff":
        return <IndexStaff />;
      case "addStaff":
        return <AddStaff />;
      case "contracts":
        return <IndexAgreement />;
      case "addAgreement":
        return <AddAgreement />;
      case "editAgreement":
        return <EditAgreement />;
      case "viewAgreement":
        return <AgreementView />;
      case "billing":
        return <IndexInvoice />;
      case "addInvoice":
        return <AddInvoice />;
      case "editInvoice":
        return <EditInvoice />;
      case "viewInvoice":
        return <InvoiceView />;
      case "settings":
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className="max-w-7xl mx-auto">{renderComponent()}</div>
    </div>
  );
}
