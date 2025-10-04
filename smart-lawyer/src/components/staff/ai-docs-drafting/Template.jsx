import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CivilPetition from "./CivilPetition";
import Plaint from "./Plaint";
import WrittenStatement from "./WrittenStatement";
import Replication from "./Replication";
import InterimApplication from "./InterimApplication";
import Affidavit from "./Affidavit";
import RentalAgreement from "./RentalAgreement";

// Refactored Template component: shows cards first, then loads specific template component
const Template = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("");

  const documentTypes = [
    {
      id: "civil-petition",
      name: "Civil Petition",
      description: "A formal request made to a court in civil proceedings",
      icon: "ri-file-list-3-line",
      color: "bg-blue-500",
    },
    {
      id: "plaint",
      name: "Plaint",
      description: "A legal document that starts a lawsuit",
      icon: "ri-draft-line",
      color: "bg-purple-500",
    },
    {
      id: "written-statement",
      name: "Written Statement",
      description: "A defendant's response to a plaint",
      icon: "ri-file-text-line",
      color: "bg-emerald-500",
    },
    {
      id: "replication",
      name: "Replication",
      description: "A plaintiff's response to a defendant's written statement",
      icon: "ri-reply-line",
      color: "bg-amber-500",
    },
    {
      id: "interim-application",
      name: "Interim Application",
      description: "Request for temporary relief during ongoing proceedings",
      icon: "ri-file-paper-2-line",
      color: "bg-pink-500",
    },
    {
      id: "affidavit",
      name: "Affidavit",
      description: "A written statement under oath",
      icon: "ri-file-paper-line",
      color: "bg-indigo-500",
    },
    {
      id: "rental-agreement",
      name: "Rental / Lease Agreement",
      description: "Agreement between landlord and tenant",
      icon: "ri-home-gear-line",
      color: "bg-teal-500",
    },
  ];

  const renderSelectedTemplate = () => {
    switch (selectedType) {
      case "civil-petition":
        return <CivilPetition />;
      case "plaint":
        return <Plaint />;
      case "written-statement":
        return <WrittenStatement />;
      case "replication":
        return <Replication />;
      case "interim-application":
        return <InterimApplication />;
      case "affidavit":
        return <Affidavit />;
      case "rental-agreement":
        return <RentalAgreement />;
      default:
        return null;
    }
  };

  const selectedTypeMeta = documentTypes.find((d) => d.id === selectedType);

  return (
    <>
      <div className="flex justify-start items-center mb-4 gap-3 bg-white rounded-xl p-3 border border-gray-200">
        {!selectedType ? (
          <button
            onClick={() => navigate("/staff/dashboard")}
            className="bg-emerald-100 py-2 px-3 rounded-xl text-emerald-600 hover:bg-emerald-200 transition"
          >
            <i className="ri-arrow-left-line"></i>
          </button>
        ) : (
          <button
            onClick={() => setSelectedType("")}
            className="bg-emerald-100 py-2 px-3 rounded-xl text-emerald-600 hover:bg-emerald-200 transition"
          >
            <i className="ri-arrow-left-line"></i>
          </button>
        )}
        {!selectedType ? (
          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-0.5">
              Select Document Type
            </h2>
            <p className="text-gray-600 text-xs">
              Choose the type of legal document you want to generate
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-0.5">
              {selectedTypeMeta?.name}
            </h2>
            <p className="text-gray-600 text-xs">
              {selectedTypeMeta?.description}
            </p>
          </div>
        )}
      </div>

      {!selectedType ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentTypes.map((type) => (
            <div
              key={type.id}
              className="border border-gray-200 bg-white rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer flex items-start"
              onClick={() => setSelectedType(type.id)}
            >
              <div
                className={`w-9 h-9 ${type.color} rounded-xl text-white flex items-center justify-center flex-shrink-0`}
              >
                <i className={`${type.icon} text-lg`}></i>
              </div>
              <div className="ml-3">
                <h3 className="font-semibold text-sm text-gray-800">
                  {type.name}
                </h3>
                <p className="text-xs text-gray-500">{type.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        renderSelectedTemplate()
      )}
    </>
  );
};

export default Template;
