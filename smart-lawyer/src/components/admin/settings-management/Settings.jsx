import React, { useState } from "react";
import Permissions from "./Permissions";

const Settings = () => {
  const [showPermissions, setShowPermissions] = useState(false);
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="border-y-2 border-gray-200 py-3">
        <button
          type="button"
          onClick={() => setShowPermissions((v) => !v)}
          className="w-full text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <i className="ri-shield-user-line text-2xl text-gray-400"></i>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Permissions
                </h3>
                <p className="text-gray-500 text-xs">
                  Manage module permissions per staff member
                </p>
              </div>
            </div>
            <i
              className={`ri-arrow-down-s-line text-2xl text-gray-400 transition-transform duration-400 group-hover:text-gray-600 ${
                showPermissions ? "rotate-180" : ""
              }`}
            ></i>
          </div>
        </button>
        {showPermissions && <Permissions />}
      </div>
    </div>
  );
};

export default Settings;
