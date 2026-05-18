"use client";
import { useState } from "react";

export default function PriceSection() {
  const [activeTab, setActiveTab] = useState("breakup");

  return (
    <div className="block space-y-4">

      {/* Animated Toggle */}
      <div className="relative bg-gray-100 rounded-full p-1 flex text-sm font-medium overflow-hidden">
        <div
          className={`absolute top-1 bottom-1 w-1/2 rounded-full bg-primary transition-all duration-300 ${activeTab === "breakup" ? "left-1" : "left-1/2"
            }`}
        />
        <button
          onClick={() => setActiveTab("breakup")}
          className={`relative z-10 flex-1 py-3 rounded-full transition-colors duration-300 cursor-pointer ${activeTab === "breakup"
              ? "text-white"
              : "text-gray-600"
            }`}
        >
          Price Breakup
        </button>
        <button
          onClick={() => setActiveTab("savings")}
          className={`relative z-10 flex-1 py-3 rounded-full transition-colors duration-300 cursor-pointer ${activeTab === "savings"
              ? "text-white"
              : "text-gray-600"
            }`}
        >
          Your Savings
        </button>
      </div>


      {/* Animated Content */}
      <div className="relative overflow-hidden">
        <div
          className={`flex transition-transform duration-500 ${activeTab === "breakup"
              ? "translate-x-0"
              : "-translate-x-1/2"
            }`}
          style={{ width: "200%" }}
        >

          {/* ================= PRICE BREAKUP ================= */}
          <div className="w-1/2">
            <div className="bg-gray-100 rounded-2xl p-6 space-y-3 text-[12px]">

              <div className="flex justify-between">
                <span>14K Yellow Gold</span>
                <span className="font-bold">₹26,762</span>
              </div>

              <div className="flex justify-between">
                <span>Diamond</span>
                <span className="font-bold">₹7,224</span>
              </div>

              <div className="flex justify-between">
                <span>Making Charges</span>
                <span className="font-bold">₹3,885</span>
              </div>

              <div className="flex justify-between">
                <span>GST (3%)</span>
                <span className="font-bold">₹1,136</span>
              </div>

              <hr />

              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>₹39,007</span>
              </div>
            </div>
          </div>

          {/* ================= YOUR SAVINGS ================= */}
          <div className="w-1/2">
            <div className="bg-gray-100 rounded-2xl p-6 space-y-3 text-[12px]">
              <div className="grid grid-cols-3 font-medium text-gray-900">
                <div>Diamond Comparison</div>
                <div>Lucira Grown</div>
                <div>Mined</div>
              </div>

              <div className="grid grid-cols-3">
                <div>Price</div>
                <div>₹7,224</div>
                <div>₹18,228</div>
              </div>

              <div className="grid grid-cols-3">
                <div>Carat</div>
                <div>0.21 CT</div>
                <div>0.21 CT</div>
              </div>

              <div className="grid grid-cols-3">
                <div>Clarity</div>
                <div>VVS</div>
                <div>SI</div>
              </div>

              <div className="grid grid-cols-3">
                <div>Color</div>
                <div>EF</div>
                <div>IJ</div>
              </div>

              <div className="grid grid-cols-3 font-semibold">
                <div>Total Saving</div>
                <div className="text-green-600">₹11,004</div>
                <div className="text-red-500">₹0</div>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}