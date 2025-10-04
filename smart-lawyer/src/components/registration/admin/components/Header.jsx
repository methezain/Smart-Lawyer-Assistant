import React from "react";

export default function Header() {
  return (
    <div className="h-[65px] w-full bg-[#04121B] text-white px-16 flex justify-between items-center fixed top-0 left-0 right-0 z-10">
      <div>
        <h1 className="text-lg font-bold">LOGO</h1>
      </div>
      <div>
        <h1 className="text-lg font-bold">Button</h1>
      </div>
    </div>
  );
}
