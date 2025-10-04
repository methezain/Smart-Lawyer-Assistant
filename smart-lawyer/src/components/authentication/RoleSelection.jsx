import React from "react";
import { useNavigate, Link } from "react-router-dom";

export default function RoleSelection() {
  const navigate = useNavigate();

  const handleRoleSelection = (role) => {
    navigate(`/auth/${role}`);
  };

  return (
    <div className="bg-[#dededa] h-dvh w-full overflow-hidden flex justify-between">
      <div className="h-full w-1/2 p-6">
        <div
          className="bg-cover bg-center h-full w-full relative"
          style={{
            backgroundImage: 'url("/picture2.png")',
          }}
        >
          <div className="w-full h-full bg-[#0c0c0c]/65 relative flex justify-start items-start p-6 text-white">
            <h1 className="text-4xl ">LOGO</h1>
          </div>{" "}
        </div>
      </div>
      <div className="h-full w-1/2 text-[#0c0c0c] p-6 flex justify-center items-center relative">
        <div className="flex flex-col justify-center items-center w-[300px]">
          <h1 className="text-[36px] mb-1.5">Select Your Role</h1>
          <p className="text-[14px] w-[300px] tracking-wider capitalize text-center">
            Alias et praesentium libero nam provident odio animi eius doloribus
            accusamus.
          </p>
          <button
            onClick={() => handleRoleSelection("admin")}
            className="rounded-xl w-full mt-6 py-2 text-[14px] text-[#dededa] bg-[#0c0c0c] hover:bg-[#dededa] hover:text-[#0c0c0c] border-2 border-[#0c0c0c] cursor-pointer transition-colors"
          >
            Continue as Admin
          </button>
          <button
            onClick={() => handleRoleSelection("staff")}
            className="rounded-xl w-full my-4 py-2 text-[14px] text-[#dededa] bg-[#0c0c0c] hover:bg-[#dededa] hover:text-[#0c0c0c] border-2 border-[#0c0c0c] cursor-pointer transition-colors"
          >
            Continue as Staff
          </button>
          <button
            onClick={() => handleRoleSelection("client")}
            className="rounded-xl w-full mb-6 py-2 text-[14px] text-[#dededa] bg-[#0c0c0c] hover:bg-[#dededa] hover:text-[#0c0c0c] border-2 border-[#0c0c0c] cursor-pointer transition-colors"
          >
            Continue as Client
          </button>
          <div className="pb-5">
            <Link
              to="/"
              className="text-[12px] w-60 tracking-wider font-bold hover:underline"
            >
              Go Back to Home
            </Link>
          </div>
        </div>
        <p className="text-xs absolute bottom-5 right-7">
          © 2025 smartlawyer.inc & its affiliates
        </p>
      </div>
    </div>
  );
}
