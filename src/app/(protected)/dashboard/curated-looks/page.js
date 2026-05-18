"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, Trash2, Save, MoveUp, MoveDown, Package, X, Loader2, Target, ExternalLink, Upload } from "lucide-react";
import Image from "next/image";
import { uploadToShopify } from "@/lib/utils";

export default function CuratedLooksDashboard() {
  const [looks, setLooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null); // lookIndex
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null); // { lookIndex, hotspotIndex }
  const [isCapturingCoord, setIsCapturingCoord] = useState(null); // lookIndex

  useEffect(() => {
    fetchLooks();
  }, []);

  const fetchLooks = async () => {
    try {
      const res = await fetch("/api/curated-looks");
      const data = await res.json();
      if (data.success) {
        setLooks(data.looks || []);
      }
    } catch (err) {
      console.error("Failed to fetch looks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/curated-looks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(looks),
      });
      const data = await res.json();
      if (data.success) {
        alert("Curated looks saved successfully!");
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      alert("Error saving looks: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addLook = () => {
    setLooks([...looks, { 
        name: "", 
        image: "", 
        assetName: "",
        href: "", 
        hotspots: [] 
    }]);
  };

  const removeLook = (index) => {
    if (confirm("Are you sure you want to remove this look?")) {
      const newLooks = [...looks];
      newLooks.splice(index, 1);
      setLooks(newLooks);
    }
  };

  const updateLook = (index, field, value) => {
    const newLooks = [...looks];
    newLooks[index][field] = value;
    setLooks(newLooks);
  };

  const moveLook = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === looks.length - 1)) return;
    const newLooks = [...looks];
    const temp = newLooks[index];
    newLooks[index] = newLooks[index + direction];
    newLooks[index + direction] = temp;
    setLooks(newLooks);
  };

  const handleUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(index);
      const customName = looks[index].assetName;
      const url = await uploadToShopify(file, customName);
      updateLook(index, "image", url);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(null);
    }
  };

  const handleImageClick = (e, lookIndex) => {
    if (isCapturingCoord !== lookIndex) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newLooks = [...looks];
    const hotspotId = Date.now();
    newLooks[lookIndex].hotspots.push({
      id: hotspotId,
      x: `${x.toFixed(2)}%`,
      y: `${y.toFixed(2)}%`,
      product: null
    });

    setLooks(newLooks);
    setIsCapturingCoord(null);
    // Automatically open search for the new hotspot
    setActiveSlot({ lookIndex, hotspotIndex: newLooks[lookIndex].hotspots.length - 1 });
  };

  const searchProducts = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setSearchResults(data.products || []);
    } catch (err) {
      console.error("Search error", err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) searchProducts(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const selectProduct = (product) => {
    if (!activeSlot) return;
    const { lookIndex, hotspotIndex } = activeSlot;
    const newLooks = [...looks];
    
    const formatPrice = (num) => {
      return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(num));
    };

    const price = product.price || 0;
    const oldPrice = product.compareAtPrice || product.price || 0;

    newLooks[lookIndex].hotspots[hotspotIndex].product = {
      name: product.title,
      image: product.images?.[0]?.url || "",
      price: formatPrice(price),
      oldPrice: oldPrice > price ? formatPrice(oldPrice) : null,
      href: `/products/${product.handle}`
    };

    setLooks(newLooks);
    setActiveSlot(null);
    setSearchTerm("");
    setSearchResults([]);
  };

  const removeHotspot = (lookIndex, hotspotIndex) => {
    const newLooks = [...looks];
    newLooks[lookIndex].hotspots.splice(hotspotIndex, 1);
    setLooks(newLooks);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 bg-zinc-50 dark:bg-black min-h-screen text-zinc-900 dark:text-zinc-100">
      <div className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">Curated Looks Management</h1>
          <p className="text-zinc-500">Create Shoppable lookbooks with interactive hotspots.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={addLook}
            className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-6 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
          >
            <Plus size={16} />
            Add New Look
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-6 py-2.5 rounded-2xl shadow-lg shadow-black/10 dark:shadow-white/5 font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save All Changes
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {looks.map((look, lIndex) => (
          <div key={look._id || `l-${lIndex}`} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-xl">
            {/* Card Header */}
            <div className="px-8 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-sm font-black">
                  {lIndex + 1}
                </div>
                <div>
                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-400">Look Setting</h3>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{look.name || "Untitled Look"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <button 
                    onClick={() => moveLook(lIndex, -1)} 
                    disabled={lIndex === 0}
                    className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <MoveUp size={16} />
                  </button>
                  <button 
                    onClick={() => moveLook(lIndex, 1)} 
                    disabled={lIndex === looks.length - 1}
                    className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <MoveDown size={16} />
                  </button>
                </div>
                <button 
                  onClick={() => removeLook(lIndex)} 
                  className="p-3 hover:bg-red-50 text-red-500 rounded-xl transition-colors border border-transparent hover:border-red-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Look Image & Hotspot Interface */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <Target size={12} />
                      Interactive Canvas
                    </label>
                    <button 
                        onClick={() => setIsCapturingCoord(isCapturingCoord === lIndex ? null : lIndex)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${
                            isCapturingCoord === lIndex 
                            ? "bg-black text-white dark:bg-white dark:text-black animate-pulse" 
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white"
                        }`}
                    >
                        {isCapturingCoord === lIndex ? "Click on Image" : "Add Hotspot"}
                    </button>
                  </div>

                  <div 
                    className={`relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-zinc-100 dark:bg-zinc-950 ring-1 ring-zinc-200 dark:ring-zinc-800 shadow-inner group/canvas ${
                        isCapturingCoord === lIndex ? "cursor-crosshair ring-2 ring-black dark:ring-white" : ""
                    }`}
                    onClick={(e) => handleImageClick(e, lIndex)}
                  >
                    {look.image ? (
                        <>
                            <Image src={look.image} alt="Look" fill className="object-cover" />
                            {look.hotspots.map((spot, sIndex) => (
                                <div 
                                    key={spot.id} 
                                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2" 
                                    style={{ left: spot.x, top: spot.y }}
                                >
                                    <div className={`w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all ${
                                        activeSlot?.lookIndex === lIndex && activeSlot?.hotspotIndex === sIndex
                                        ? "bg-black scale-125 z-20"
                                        : "bg-black/40 backdrop-blur-sm hover:scale-110"
                                    }`}>
                                        <span className="text-[10px] font-black text-white">{sIndex + 1}</span>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-4">
                            <Target size={48} strokeWidth={1} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Image Provided</p>
                        </div>
                    )}
                  </div>
                </div>

                {/* Settings & Hotspot List */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Look Name</label>
                        <input
                            type="text"
                            value={look.name}
                            onChange={(e) => updateLook(lIndex, "name", e.target.value)}
                            placeholder="e.g. Summer Engagement"
                            className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-bold"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Asset Name (for Shopify)</label>
                        <input
                            type="text"
                            value={look.assetName}
                            onChange={(e) => updateLook(lIndex, "assetName", e.target.value)}
                            placeholder="e.g. engagement-banner-01"
                            className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center justify-between">
                            Image URL
                            <span className="flex items-center gap-1.5 text-zinc-300">
                                <Upload size={10} /> Direct Shopify Upload
                            </span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={look.image}
                                onChange={(e) => updateLook(lIndex, "image", e.target.value)}
                                placeholder="/images/curated/..."
                                className="flex-1 px-5 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-medium"
                            />
                            <label className={`shrink-0 w-14 flex items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all cursor-pointer bg-white dark:bg-zinc-900 group/up ${uploading === lIndex ? 'pointer-events-none opacity-50' : ''}`}>
                                {uploading === lIndex ? (
                                    <Loader2 className="animate-spin text-zinc-400" size={20} />
                                ) : (
                                    <Upload className="text-zinc-400 group-hover/up:text-black dark:group-hover/up:text-white transition-colors" size={20} />
                                )}
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => handleUpload(e, lIndex)}
                                />
                            </label>
                        </div>
                    </div>
                    <div className="space-y-3 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Collection Link (HREF)</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={look.href}
                                onChange={(e) => updateLook(lIndex, "href", e.target.value)}
                                placeholder="/collections/..."
                                className="w-full pl-5 pr-12 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-medium"
                            />
                            <ExternalLink size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <Package size={12} />
                        Hotspot Products ({look.hotspots.length})
                        </label>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {look.hotspots.map((spot, sIndex) => (
                        <div key={spot.id} className={`p-4 rounded-3xl border transition-all flex items-center gap-5 group/spot ${
                            activeSlot?.lookIndex === lIndex && activeSlot?.hotspotIndex === sIndex
                            ? "bg-zinc-100 dark:bg-zinc-800 border-black dark:border-white ring-4 ring-black/5"
                            : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300"
                        }`}>
                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                                <span className="text-xs font-black">{sIndex + 1}</span>
                            </div>

                            {spot.product ? (
                                <div className="flex-1 flex items-center gap-4 min-w-0">
                                    <div className="w-16 h-16 bg-zinc-50 rounded-xl overflow-hidden relative shrink-0 border border-zinc-100">
                                        {spot.product.image && <Image src={spot.product.image} alt="Prod" fill className="object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold truncate pr-4 leading-tight">{spot.product.name}</h4>
                                        <p className="text-xs font-black mt-1">{spot.product.price}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 py-4 flex items-center justify-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">
                                    <button 
                                        onClick={() => setActiveSlot({ lookIndex: lIndex, hotspotIndex: sIndex })}
                                        className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black dark:hover:text-white"
                                    >
                                        Assign Product
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-1 opacity-0 group-hover/spot:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => setActiveSlot({ lookIndex: lIndex, hotspotIndex: sIndex })}
                                    className="p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-xl text-zinc-500 transition-colors"
                                >
                                    <Search size={16} />
                                </button>
                                <button 
                                    onClick={() => removeHotspot(lIndex, sIndex)}
                                    className="p-2.5 hover:bg-red-50 text-red-500 rounded-xl transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                      ))}

                      {look.hotspots.length === 0 && (
                          <div className="py-12 flex flex-col items-center justify-center gap-3 bg-zinc-50/50 dark:bg-zinc-950/50 rounded-[2rem] border-2 border-dashed border-zinc-100 dark:border-zinc-800 text-zinc-400">
                              <Target size={32} strokeWidth={1} />
                              <p className="text-[10px] font-black uppercase tracking-widest">No hotspots yet. Add one from the canvas.</p>
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {looks.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <Package size={48} className="mx-auto text-zinc-200 mb-4" />
            <h3 className="text-lg font-bold">No looks created</h3>
            <p className="text-zinc-500 mb-6">Start by creating your first shoppable lookbook.</p>
            <button onClick={addLook} className="bg-black text-white px-8 py-3 rounded-xl font-bold">Create New Look</button>
          </div>
        )}
      </div>

      {/* Product Search Modal */}
      {activeSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50">
              <h2 className="text-xl font-black flex items-center gap-3 tracking-tight">
                <Package size={24} className="text-zinc-400" />
                Tag Product to Hotspot
              </h2>
              <button 
                onClick={() => { setActiveSlot(null); setSearchTerm(""); setSearchResults([]); }}
                className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" size={20} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search products by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-zinc-100/50 dark:bg-zinc-950 border border-transparent focus:border-zinc-200 dark:focus:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 transition-all font-medium"
                />
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {searching ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="animate-spin text-zinc-300" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Searching Catalogue</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((product) => (
                    <button
                      key={product._id || product.id || product.handle}
                      onClick={() => selectProduct(product)}
                      className="w-full flex items-center gap-5 p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group/item border border-transparent hover:border-zinc-100 dark:hover:border-zinc-700"
                    >
                      <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden relative shrink-0 group-hover/item:scale-105 transition-transform">
                        {product.images?.[0]?.url && <Image src={product.images[0].url} alt={product.title} fill className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate group-hover/item:text-black dark:group-hover/item:text-white transition-colors">{product.title}</p>
                        <p className="text-xs font-black mt-1">₹{new Intl.NumberFormat("en-IN").format(product.price)}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <Plus size={16} />
                      </div>
                    </button>
                  ))
                ) : searchTerm ? (
                  <div className="text-center py-16">
                    <Package size={40} className="mx-auto text-zinc-200 mb-4" />
                    <p className="text-sm font-bold">No products found</p>
                    <p className="text-xs text-zinc-400 mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Search size={40} className="mx-auto text-zinc-200 mb-4" />
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Start searching above</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
