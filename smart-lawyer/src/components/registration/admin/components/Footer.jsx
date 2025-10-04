import React from "react";

export default function Footer() {
  return (
    <div>
      <div className="h-[70px] w-full bg-[#04121B] px-16 flex justify-between items-center text-xs text-white">
        <div className="flex items-center gap-4">
          <a href="/">Get Support</a>
          <a href="/">Policies and Agreements</a>
          <a href="/">Rules, and Guidelines</a>
        </div>
        <div>
          <p className="">© 2025 smartlawyer.inc & its affiliates</p>
        </div>
      </div>
    </div>
  );
}
