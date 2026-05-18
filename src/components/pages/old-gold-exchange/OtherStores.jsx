"use client";

import { useState } from "react";
import LazyImage from "@/components/common/LazyImage";
import { MapPin, Phone, Clock3, Navigation, CalendarDays, CheckCircle } from "lucide-react";

export default function OtherStores({ data }) {
  const { heading, subtext, stores } = data;
  const [pincode, setPincode] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [matchedStores, setMatchedStores] = useState([]);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const parseRange = (rangeText) => {
    if (!rangeText) return null;
    const parts = rangeText.replace(/\s/g, '').split(/[-–—]/);
    if (parts.length === 1) return [parseInt(parts[0]), parseInt(parts[0])];
    return [parseInt(parts[0]), parseInt(parts[1])];
  };

  const handlePincodeSubmit = (e) => {
    if (e) e.preventDefault();
    const pin = parseInt(pincode.trim());
    if (!pin) return;

    const matched = stores.filter((store) => {
      const range = parseRange(store.pincode_range);
      if (!range) return false;
      const [min, max] = range;
      return pin >= min && pin <= max;
    });

    setMatchedStores(matched);
    setShowResults(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <section className="other-stores py-20 bg-[#f7f3f2]">
      <div className="container-main mx-auto px-4 max-w-[1200px]">
        
        {/* Pincode Search for this section */}
        <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-abhaya font-semibold uppercase tracking-[2px] mb-6 text-primary">Checking availability in your area?</h2>
            <div className="flex justify-center">
                <div className="flex w-full max-w-[400px] border border-[#b76f79] rounded-lg overflow-hidden bg-white shadow-sm font-figtree">
                    <input 
                        type="tel" 
                        placeholder="Enter Pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        onKeyUp={(e) => e.key === 'Enter' && handlePincodeSubmit()}
                        className="flex-grow p-4 outline-none text-sm tracking-widest"
                    />
                    <button 
                        onClick={handlePincodeSubmit}
                        className="bg-[#b76f79] text-white px-8 uppercase text-xs font-bold tracking-widest"
                    >
                        Check
                    </button>
                </div>
            </div>
        </div>

        {showResults && (
            <>
                <div className="mumbai-other text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-medium uppercase tracking-[2px] mb-3">
                        {matchedStores.length > 0 ? heading || "Stores Near You" : "NO STORE FOUND NEARBY"}
                    </h2>
                    {subtext && matchedStores.length > 0 && (
                        <p className="text-gray-500 text-lg">{subtext}</p>
                    )}
                </div>

                {matchedStores.length > 0 ? (
                    <div className="stores-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {matchedStores.map((store, index) => (
                            <div key={index} className="store-card bg-white rounded-2xl overflow-hidden shadow-xl shadow-black/5 flex flex-col">
                                <div className="store-image relative h-[318px]">
                                    <LazyImage src={store.image} alt={store.name} fill className="object-cover" />
                                    <div className="absolute right-0 bottom-0 p-3 bg-white rounded-tl-[32px]">
                                        <div className="w-10 h-10 border border-black rounded-full flex items-center justify-center">
                                            <Navigation size={20} />
                                        </div>
                                    </div>
                                </div>

                                <div className="store-info-container p-6 flex-grow">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">{store.city}</span>
                                    <h3 className="text-lg font-semibold uppercase tracking-wider mb-4 border-b border-gray-100 pb-4">{store.name}</h3>
                                    
                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <MapPin size={18} className="text-[#1a1a1a] flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-gray-500 leading-relaxed">{store.address}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Phone size={16} className="text-[#1a1a1a]" />
                                                {store.phone}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Clock3 size={16} className="text-[#1a1a1a]" />
                                                {store.timings}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="store-buttons flex gap-2">
                                        <a href={store.map_link} className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#b89c9c] text-[#5a4b4b] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all">
                                            Direct Me
                                        </a>
                                        <a href={store.appointment_link} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#b89c9c] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#a58989] transition-all">
                                            Explore Instore
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="contact-online-form-wrapper max-w-[700px] mx-auto">
                        {!formSubmitted ? (
                            <div className="bg-white p-10 rounded-xl shadow-xl shadow-black/5">
                                <h2 className="text-2xl font-medium uppercase tracking-[2px] text-center mb-10 text-[#333]">GET STARTED ONLINE</h2>
                                <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-group flex flex-col text-left">
                                        <label className="text-[12px] font-medium text-gray-500 mb-2 uppercase tracking-widest">Name</label>
                                        <input type="text" placeholder="Enter Full Name" required className="p-4 border border-gray-200 rounded-lg text-sm" />
                                    </div>
                                    <div className="form-group flex flex-col text-left">
                                        <label className="text-[12px] font-medium text-gray-500 mb-2 uppercase tracking-widest">Number</label>
                                        <input type="tel" placeholder="Enter Number" required className="p-4 border border-gray-200 rounded-lg text-sm" />
                                    </div>
                                    <button type="submit" className="md:col-span-2 py-4 bg-[#c8b4b0] text-white font-bold uppercase tracking-widest rounded-lg hover:bg-[#b39a97] transition-all mt-4">
                                        Submit
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="bg-white p-10 rounded-xl shadow-xl shadow-black/5 text-center transition-all animate-in fade-in zoom-in duration-500">
                                <div className="flex justify-center mb-6">
                                    <CheckCircle size={100} className="text-green-600" />
                                </div>
                                <h3 className="text-2xl font-medium uppercase tracking-[2px] leading-relaxed text-[#333] mb-6">
                                    OUR EXECUTIVE WILL CONTACT YOU SHORTLY
                                </h3>
                                <button 
                                    onClick={() => setFormSubmitted(false)} 
                                    className="text-gray-500 underline text-sm hover:text-black transition-colors"
                                >
                                    Refill Form
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </>
        )}

      </div>
    </section>
  );
}