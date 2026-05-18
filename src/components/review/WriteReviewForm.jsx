"use client";

import { X, Star, Upload, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitReview, uploadSingleImage, extractReviewId } from "@/lib/nector";

export default function WriteReviewForm({ isOpen, onClose, productId, onSuccess, productTitle, productImage, productHandle }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    title: "",
    review: "",
  });
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRatingClick = (val) => setRating(val);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    let newErrors = {};
    if (rating === 0) newErrors.rating = "Please select a rating";
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    else if (formData.name.trim().length < 2) newErrors.name = "Name must be at least 2 characters";

    const mobileRegex = /^[0-9]{10}$/;
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required";
    else if (!mobileRegex.test(formData.mobile)) newErrors.mobile = "Please enter a valid 10-digit mobile number";

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) newErrors.email = "Please enter a valid email address";
    }

    if (!formData.review.trim()) newErrors.review = "Review text is required";
    else if (formData.review.trim().length < 10) newErrors.review = "Review must be at least 10 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[WriteReviewForm] Submit triggered. Current formData:", formData, "Rating:", rating);
    
    if (validate()) {
      setIsSubmitting(true);
      try {
        const cleanId = productId ? productId.toString().split('/').pop() : 'all';
        const productUrl = productHandle ? `https://www.lucirajewelry.com/products/${productHandle}` : '';

        const payload = {
          reference_product_source : 'shopify',
          reference_product_id     : cleanId,
          reference_product_name   : productTitle || '',
          reference_product_image  : productImage || '',
          reference_product_url    : productUrl,
          name: formData.name,
          rating,
          description : formData.review,
          metadetail  : { mobile: formData.mobile, country: 'ind' },
        };
        if (formData.email) payload.metadetail.email = formData.email;
        if (formData.title) payload.title = formData.title;

        console.log("[WriteReviewForm] Submitting review payload:", payload);
        const result = await submitReview(payload);
        console.log("[WriteReviewForm] Review submission successful. Result:", result);

        const success = result?.meta?.code === 200 || result?.data?.success === true;
        if (!success && !result?.review_id && !result?.data?.review_id) {
            throw new Error(result?.meta?.message || result?.message || 'Review submission failed');
        }

        const reviewId = extractReviewId(result);
        console.log("[WriteReviewForm] Extracted Review ID:", reviewId);

        // If there are images and we have a reviewId, upload them
        if (images.length > 0) {
          if (reviewId) {
            console.log(`[WriteReviewForm] Found ${images.length} images. Starting uploads for Review ID: ${reviewId}`);
            const uploadPromises = images.map((file, index) => {
              console.log(`[WriteReviewForm] Initiating upload for image ${index + 1}/${images.length}: ${file.name}`);
              return uploadSingleImage(file, reviewId);
            });
            
            const uploadResults = await Promise.all(uploadPromises);
            console.log("[WriteReviewForm] All image uploads completed. Results:", uploadResults);
          } else {
            console.warn("[WriteReviewForm] Images present but no reviewId found in response. Skipping uploads.");
          }
        } else {
          console.log("[WriteReviewForm] No images selected for upload.");
        }

        alert("Review submitted successfully!");
        onSuccess?.();
        onClose();
        // Reset form
        setFormData({
          name: "",
          mobile: "",
          email: "",
          title: "",
          review: "",
        });
        setRating(0);
        setImages([]);
      } catch (error) {
        console.error("[WriteReviewForm] Error in submission process:", error);
        alert(error.message || "Failed to submit review. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.warn("[WriteReviewForm] Validation failed. Errors:", errors);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // Just a placeholder for now as per instructions
    setImages((prev) => [...prev, ...files]);
  };

  return (
    <div className="fixed inset-0 z-[499] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-[#FEF5F1] rounded-3xl shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="bg-[#5A413F] p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-abhaya font-bold tracking-tight">Write a Review</h2>
            <p className="text-white/70 text-xs uppercase tracking-[0.2em] mt-1">Share your Lucira experience</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
          
          {/* Rating Selection */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">How would you rate it?</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => {
                    handleRatingClick(star);
                    if (errors.rating) setErrors(prev => ({ ...prev, rating: "" }));
                  }}
                  className="transition-transform active:scale-90"
                >
                  <Star
                    size={40}
                    fill={(hoverRating || rating) >= star ? "#5A413F" : "none"}
                    className={(hoverRating || rating) >= star ? "text-[#5A413F]" : errors.rating ? "text-red-400" : "text-gray-300"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            {errors.rating && <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{errors.rating}</span>}
            {rating > 0 && !errors.rating && (
              <span className="text-xs font-bold text-[#5A413F] uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                {rating === 5 ? "Excellent!" : rating === 4 ? "Very Good" : rating === 3 ? "Average" : rating === 2 ? "Poor" : "Terrible"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Your Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Jane Doe"
                className={`w-full bg-white border ${errors.name ? 'border-red-300' : 'border-gray-100'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A413F]/20 focus:border-[#5A413F] transition-all`}
              />
              {errors.name && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.name}</p>}
            </div>
            {/* Mobile */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder="e.g. 9876543210"
                className={`w-full bg-white border ${errors.mobile ? 'border-red-300' : 'border-gray-100'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A413F]/20 focus:border-[#5A413F] transition-all`}
              />
              {errors.mobile && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.mobile}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address (Optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="jane@example.com"
              className={`w-full bg-white border ${errors.email ? 'border-red-300' : 'border-gray-100'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A413F]/20 focus:border-[#5A413F] transition-all`}
            />
            {errors.email && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.email}</p>}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Review Title (Optional)</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Give your review a title"
              className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A413F]/20 focus:border-[#5A413F] transition-all"
            />
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Your Review</label>
            <textarea
              name="review"
              value={formData.review}
              onChange={handleInputChange}
              rows={4}
              placeholder="Tell us about your experience..."
              className={`w-full bg-white border ${errors.review ? 'border-red-300' : 'border-gray-100'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A413F]/20 focus:border-[#5A413F] transition-all resize-none`}
            />
            {errors.review && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.review}</p>}
          </div>

          {/* Photo Upload */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Add Photos (Optional)</span>
            <div className="flex flex-wrap gap-4">
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#5A413F] hover:bg-white transition-all text-gray-400 hover:text-[#5A413F]">
                <Upload size={20} />
                <span className="text-[8px] font-bold uppercase mt-1">Upload</span>
                <input type="file" multiple className="hidden" onChange={handleImageChange} accept="image/*" />
              </label>
              {images.map((img, i) => (
                <div key={i} className="w-20 h-20 rounded-xl bg-white border border-gray-100 overflow-hidden relative group">
                  <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-[#5A413F] text-white font-black text-xs uppercase tracking-[0.3em] rounded-xl shadow-xl hover:bg-[#4a3533] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
            <p className="text-[9px] text-gray-400 text-center mt-4 uppercase tracking-widest font-medium">
              By submitting, you agree to our terms of service and privacy policy.
            </p>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
