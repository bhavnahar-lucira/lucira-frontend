import './dashboard.css';
"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Trash2, Save, MoveUp, MoveDown, Video, Package, X, Loader2 } from "lucide-react";
import Image from "next/image";

export default function StyledVideosDashboard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null); // { videoIndex, productIndex }

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8080/api/styled-videos");
      const data = await res.json();
      if (data.success) {
        setVideos(data.videos || []);
      }
    } catch (err) {
      console.error("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("http://127.0.0.1:8080/api/styled-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videos),
      });
      const data = await res.json();
      if (data.success) {
        alert("Videos saved successfully!");
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      alert("Error saving videos: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addVideo = () => {
    setVideos([...videos, { video: "", products: [], totalPrice: "₹0" }]);
  };

  const removeVideo = (index) => {
    if (confirm("Are you sure you want to remove this video?")) {
      const newVideos = [...videos];
      newVideos.splice(index, 1);
      setVideos(newVideos);
    }
  };

  const updateVideoUrl = (index, url) => {
    const newVideos = [...videos];
    newVideos[index].video = url;
    setVideos(newVideos);
  };

  const moveVideo = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === videos.length - 1)) return;
    const newVideos = [...videos];
    const temp = newVideos[index];
    newVideos[index] = newVideos[index + direction];
    newVideos[index + direction] = temp;
    setVideos(newVideos);
  };

  const searchProducts = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`http://127.0.0.1:8080/api/products/search?q=${encodeURIComponent(query)}&limit=5`);
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
    const { videoIndex, productIndex } = activeSlot;
    const newVideos = [...videos];
    const video = newVideos[videoIndex];

    const formatPrice = (num) => {
      return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(num));
    };

    const price = product.price || 0;
    const originalPrice = product.compareAtPrice || product.price || 0;
    const discount = originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100) + "% OFF"
      : "";

    const productData = {
      image: product.image || product.images?.[0]?.url || "",
      title: product.title,
      price: formatPrice(price),
      originalPrice: formatPrice(originalPrice),
      discount: discount,
      url: `/products/${product.handle}`
    };

    if (productIndex === -1) {
      if (video.products.length >= 5) {
        alert("Maximum 5 products allowed per video");
      } else {
        video.products.push(productData);
      }
    } else {
      video.products[productIndex] = productData;
    }

    const total = video.products.reduce((acc, p) => {
        const val = parseInt(p.price.replace(/[^\d]/g, '')) || 0;
        return acc + val;
    }, 0);
    video.totalPrice = formatPrice(total);

    setVideos(newVideos);
    setActiveSlot(null);
    setSearchTerm("");
    setSearchResults([]);
  };

  const removeProduct = (videoIndex, productIndex) => {
    const newVideos = [...videos];
    newVideos[videoIndex].products.splice(productIndex, 1);

    const total = newVideos[videoIndex].products.reduce((acc, p) => {
        const val = parseInt(p.price.replace(/[^\d]/g, '')) || 0;
        return acc + val;
    }, 0);
    newVideos[videoIndex].totalPrice = "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(total));

    setVideos(newVideos);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 bg-zinc-50 min-h-screen text-zinc-900">
      <div className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">Styled By Lucira Videos</h1>
          <p className="text-zinc-500">Manage the video carousel and tagged products on the homepage.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={addVideo}
            className="flex items-center gap-2 bg-white px-6 py-2 rounded-xl border border-zinc-200 shadow-sm font-bold text-sm uppercase tracking-widest hover:bg-zinc-50 transition-colors"
          >
            <Plus size={18} />
            Add Video
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-xl shadow-sm font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {videos.map((video, vIndex) => (
          <div key={vIndex} className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col group">
            <div className="px-8 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                  {vIndex + 1}
                </div>
                <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-400">Video Content</h3>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400">Total Value</span>
                  <span className="text-sm font-black text-zinc-900 tracking-tight">{video.totalPrice || "₹0"}</span>
                </div>
                <div className="h-8 w-px bg-zinc-200" />
                <div className="flex items-center gap-1">
                  <button onClick={() => moveVideo(vIndex, -1)} disabled={vIndex === 0} className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-30"><MoveUp size={16} /></button>
                  <button onClick={() => moveVideo(vIndex, 1)} disabled={vIndex === videos.length - 1} className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-30"><MoveDown size={16} /></button>
                  <button onClick={() => removeVideo(vIndex)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-32 shrink-0 space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Preview</label>
                  {video.video ? (
                    <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden relative shadow-lg ring-1 ring-zinc-200">
                      <video src={video.video} className="w-full h-full object-cover" muted loop />
                    </div>
                  ) : (
                    <div className="aspect-[9/16] bg-zinc-100 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400"><Video size={20} /></div>
                  )}
                </div>

                <div className="flex-1 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Video size={12} /> Shopify Video URL</label>
                    <input type="text" value={video.video} onChange={(e) => updateVideoUrl(vIndex, e.target.value)} placeholder="Paste Shopify CDN URL here..." className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all font-medium" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Package size={12} /> Tagged Products ({video.products?.length || 0}/5)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {video.products?.map((product, pIndex) => (
                        <div key={pIndex} className="bg-white p-3 rounded-2xl border border-zinc-200 flex gap-3 relative group/prod hover:shadow-md transition-shadow">
                          <div className="w-14 h-14 bg-zinc-50 rounded-lg overflow-hidden relative shrink-0 border border-zinc-100">
                            {product.image && <Image src={product.image} alt={product.title} fill className="object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <h4 className="text-[11px] font-bold truncate leading-tight">{product.title}</h4>
                            <span className="text-xs font-black">{product.price}</span>
                          </div>
                          <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover/prod:opacity-100 transition-opacity">
                            <button onClick={() => setActiveSlot({ videoIndex: vIndex, productIndex: pIndex })} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500"><Search size={12} /></button>
                            <button onClick={() => removeProduct(vIndex, pIndex)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                      {(video.products?.length || 0) < 5 && (
                        <button onClick={() => setActiveSlot({ videoIndex: vIndex, productIndex: -1 })} className="border-2 border-dashed border-zinc-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-black hover:border-zinc-400 transition-all bg-zinc-50/30 min-h-[78px]"><Plus size={16} /><span className="text-[9px] font-black uppercase">Add Product</span></button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-zinc-200">
            <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h2 className="text-xl font-black flex items-center gap-3">Select Product</h2>
              <button onClick={() => { setActiveSlot(null); setSearchTerm(""); setSearchResults([]); }} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-zinc-200"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-8">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input type="text" autoFocus placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-zinc-100/50 border border-transparent focus:border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-black/5 transition-all" />
              </div>
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {searching ? (
                  <div className="flex justify-center py-16"><Loader2 className="animate-spin text-zinc-300" /></div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((product) => (
                    <button key={product.id} onClick={() => selectProduct(product)} className="w-full flex items-center gap-5 p-4 rounded-2xl hover:bg-zinc-50 transition-all text-left border border-transparent hover:border-zinc-100">
                      <div className="w-16 h-16 bg-white rounded-xl border border-zinc-100 overflow-hidden relative shrink-0">
                        {product.image && <Image src={product.image} alt={product.title} fill className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{product.title}</p>
                        <p className="text-xs font-black mt-1">₹{new Intl.NumberFormat("en-IN").format(product.price)}</p>
                      </div>
                      <Plus size={16} className="text-zinc-300" />
                    </button>
                  ))
                ) : (
                  <div className="text-center py-16 text-zinc-400">Search for products above</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
