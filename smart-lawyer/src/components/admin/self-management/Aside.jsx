import React from "react";

export default function Aside() {
  return (
    <aside className="space-y-3.5 text-black lg:fixed lg:top-[70px] lg:right-4 lg:w-[375px] lg:h-[calc(100vh-70px)] lg:overflow-y-auto lg:z-20">
      {/* Pricing */}
      <div className="bg-white  rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-4 py-3 text-sm border-b border-gray-100 flex items-center gap-2">
          <i className="ri-price-tag-3-line text-emerald-600"></i>
          <h3 className="font-semibold ">Pricing</h3>
        </div>
        <div className="p-4 space-y-2 text-xs text-gray-700">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-100 px-3 py-2">
            <span className="text-gray-600">Standard Fee</span>
            <span className="font-semibold">
              PKR 000 <span className="text-gray-500 font-normal">/ case</span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-100 px-3 py-2">
            <span className="text-gray-600">Consultation Fee</span>
            <span className="font-semibold">
              PKR 000{" "}
              <span className="text-gray-500 font-normal">/ session</span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-100 px-3 py-2">
            <span className="text-gray-600">Retainer Fee</span>
            <span className="font-semibold">PKR 000</span>
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-4 py-3 text-sm border-b border-gray-100 flex items-center gap-2">
          <i className="ri-contacts-book-2-line text-emerald-600"></i>
          <h3 className="font-semibold">Contact Details</h3>
        </div>
        <div className="p-4 text-xs text-gray-700 space-y-2">
          <div className="flex items-start gap-2">
            <i className="ri-map-pin-line text-gray-400 mt-0.5"></i>
            <span>
              Office Lorem ipsum dolor sit amet consectetur adipisicing elit.
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <i className="ri-phone-line text-gray-400"></i>
              <span>+92 300 1234567</span>
            </div>

            <div className="flex items-center gap-2">
              <i className="ri-mail-line text-gray-400"></i>
              <span>john.doe@example.com</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="ri-earth-line text-gray-400"></i>
              <span>www.xyx.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-4 py-3 text-sm border-b border-gray-100 flex items-center gap-2">
          <i className="ri-time-line text-emerald-600"></i>
          <h3 className="font-semibold">Working Hours</h3>
        </div>
        <div className="p-4 text-xs text-gray-700 space-y-2">
          <div className="flex items-center justify-between">
            <span>Monday - Friday</span>
            <span className="font-medium">9:00 AM - 6:00 PM</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Saturday</span>
            <span className="font-medium">10:00 AM - 4:00 PM</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Sunday</span>
            <span className="font-medium text-red-500">Closed</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
