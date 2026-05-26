"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Navigation, Phone, CalendarDays, ExternalLink, ArrowRight } from "lucide-react";
import LazyImage from "@/components/common/LazyImage";

export default function StoreLocator({ data }) {
  const { heading, subheading, stores } = data;
  const [searchInput, setSearchInput] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [filteredStores, setFilteredStores] = useState(stores);

  // Haversine formula for distance in km
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const applyFilters = (query, location = userLocation) => {
    let list = [...stores];

    if (query && !/^\d{4,6}$/.test(query)) {
      const q = query.toLowerCase().trim();
      list = list.filter((s) =>
        (s.name + s.city + s.address).toLowerCase().includes(q)
      );
    }

    if (location) {
      list = list
        .map((s) => {
          if (!s.lat || !s.lng) return null;
          const dist = getDistance(
            location.lat,
            location.lng,
            parseFloat(s.lat),
            parseFloat(s.lng)
          );
          return { ...s, distanceValue: dist };
        })
        .filter((s) => s !== null && s.distanceValue <= 25) // 25km radius as per Liquid
        .sort((a, b) => a.distanceValue - b.distanceValue);
    }

    setFilteredStores(list);
  };

  const handleSearch = async () => {
    const query = searchInput.trim();
    if (!query) {
      applyFilters("");
      return;
    }

    // If it's a pincode, geocode it
    if (/^\d{4,6}$/.test(query)) {
      setStatusMsg("Searching for pincode...");
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${query}&country=India&format=json`);
        const d = await res.json();
        if (d && d[0]) {
          const loc = { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
          setUserLocation(loc);
          setStatusMsg(`Showing stores near ${query}`);
          applyFilters("", loc);
        } else {
          setStatusMsg("Pincode not found. Try another.");
        }
      } catch (err) {
        console.error(err);
        setStatusMsg("Error searching pincode.");
      }
      return;
    }

    applyFilters(query);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setStatusMsg("Geolocation not supported by your browser.");
      return;
    }

    setStatusMsg("Locating you...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json`);
          const d = await res.json();
          if (d?.address?.postcode) {
            const pin = d.address.postcode.replace(/\s+/g, '');
            setSearchInput(pin);
            setStatusMsg(`Detected Pincode: ${pin}`);
          } else {
            setStatusMsg("Showing nearby stores.");
          }
          applyFilters("", loc);
        } catch (err) {
          setStatusMsg("Showing nearby stores.");
          applyFilters("", loc);
        }
      },
      (err) => {
        setStatusMsg("Error detecting location. Please type manually.");
      }
    );
  };

  return (
    <section className="store-locator-section pt-10 pb-20 bg-white">
      <div className="container-main mx-auto px-4 max-w-[1200px]">

        <div className="locator-header text-center mb-10">
          <h2 className="text-[18px] md:text-[28px] font-abhaya font-semibold uppercase tracking-[2px] mb-3 text-primary">{heading}</h2>
          <p className="text-gray-500 text-[14px] md:text-[18px] max-w-[660px] mx-auto">{subheading}</p>
        </div>

        <div className="locator-controls flex flex-col items-center gap-6 mb-12">
          <div className="search-input-group flex w-full max-w-[500px] border border-[#b76f79] rounded-lg overflow-hidden shadow-sm">
            <input
              type="text"
              placeholder="Search City, Pincode..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-grow p-4 outline-none text-sm tracking-widest"
            />
            <button
              onClick={handleSearch}
              className="bg-[#b76f79] text-white px-8 uppercase text-xs font-bold tracking-widest hover:bg-[#a55f68] transition-colors"
            >
              Search
            </button>
          </div>

          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-4">
            <span className="w-10 h-px bg-gray-200"></span>
            OR
            <span className="w-10 h-px bg-gray-200"></span>
          </div>

          <button
            onClick={handleLocateMe}
            className="flex items-center gap-2 px-8 py-4 bg-white border border-[#b76f79] text-[#b76f79] rounded-lg text-sm font-medium tracking-widest hover:bg-[#fef5f1] transition-all"
          >
            <Navigation size={16} />
            Find Nearest Stores
          </button>

          {statusMsg && <p className="text-[11px] text-gray-400 italic">{statusMsg}</p>}
        </div>

        <div className="locator-results-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStores.length > 0 ? (
            filteredStores.map((store, index) => (
              <div key={index} className="store-card bg-white rounded-2xl overflow-hidden shadow-xl shadow-black/5 hover:shadow-black/10 transition-shadow">
                <div className="store-image-wrapper relative h-[280px]">
                  {store.distanceValue && (
                    <span className="absolute top-4 right-4 bg-[#e9f6ec] text-[#1b7d3c] text-[10px] font-bold px-3 py-1 rounded-full z-10 shadow-sm border border-[#1b7d3c]/10">
                      {store.distanceValue.toFixed(1)} KM AWAY
                    </span>
                  )}
                  <LazyImage
                    src={store.image}
                    alt={store.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-4 right-4">
                    <a
                      href={store.url}
                      className="w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center border border-black group"
                    >
                      <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>

                <div className="store-card-content p-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">{store.city}</span>
                  <h3 className="text-lg font-semibold uppercase tracking-wider mb-4 border-b border-gray-100 pb-4">{store.name}</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-[#b76f79] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 leading-relaxed">{store.address}</p>
                    </div>
                  </div>

                  <div className="store-actions grid grid-cols-2 gap-3">
                    <a
                      href={`tel:${store.phone}`}
                      className="flex items-center justify-center gap-2 py-3 border border-[#b76f79] text-[#b76f79] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#fef5f1] transition-all"
                    >
                      <Phone size={14} />
                      Call Us
                    </a>
                    <a
                      href={store.appointment_url}
                      className="flex items-center justify-center gap-2 py-3 bg-[#b76f79] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#a55f68] transition-all"
                    >
                      <CalendarDays size={14} />
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-gray-400 italic">
              No stores found in this area. Try searching a city or another pincode.
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
