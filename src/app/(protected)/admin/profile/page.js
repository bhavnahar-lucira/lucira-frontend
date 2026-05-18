"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  Save,
  Camera,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { logout } from "@/redux/features/user/userSlice";

const avatarColors = [
  "bg-blue-500", "bg-rose-500", "bg-emerald-500", "bg-violet-500",
  "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-indigo-500",
];

const getAvatarColor = (name) => {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

export default function MyProfilePage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({ orders: "...", points: "..." });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);

        const res = await fetch("/api/customer/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.customer) {
            setFormData({
              firstName: data.customer.firstName || "",
              lastName: data.customer.lastName || "",
              email: data.customer.email || "",
              phone: data.customer.phone || "",
            });
          }
        } else if (res.status === 401 || res.status === 404) {
          dispatch(logout());
          router.push("/login");
          return;
        }

        const avRes = await fetch("/api/customer/profile/avatar");
        if (avRes.ok) {
          const avData = await avRes.json();
          if (avData.avatar) setProfileImage(avData.avatar);
        }

        try {
          const [statsRes, ordersRes] = await Promise.all([
            fetch("/api/customer/dashboard-stats"),
            fetch("/api/customer/orders"),
          ]);
          let oCount = "0", pBal = "0";
          if (statsRes.ok) {
            const sData = await statsRes.json();
            pBal = sData.points !== undefined ? sData.points.toLocaleString() : "0";
          }
          if (ordersRes.ok) {
            const oData = await ordersRes.json();
            oCount = oData.orders?.length?.toString() || "0";
          }
          setUserStats({ orders: oCount, points: pBal });
        } catch (e) {
          console.warn("Failed to load stats", e);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [dispatch, router]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!formData.firstName || !formData.phone) {
      toast.error("First name and phone are required");
      return;
    }

    // Phone validation: strip non-digits and ensure at least 10 digits
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        }),
      });
      if (res.ok) {
        toast.success("Profile updated successfully");
      } else {
        const error = await res.json();
        throw new Error(error.error || "Update failed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const data = new FormData();
      data.append("avatar", file);
      const res = await fetch("/api/customer/profile/avatar", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        const result = await res.json();
        // Add cache buster to URL
        const imageUrl = result.url + (result.url.includes("?") ? "&" : "?") + "t=" + Date.now();
        setProfileImage(imageUrl);
        toast.success("Profile image updated");
        // Notify layout/header to refresh avatar
        window.dispatchEvent(new Event("profile-updated"));
      } else {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update profile image");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="font-figtree flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-white rounded-[2rem] border border-zinc-100">
        <Loader2 className="size-8 md:size-10 animate-spin text-primary" />
        <p className="font-figtree text-zinc-400 font-semibold uppercase tracking-[0.13em] text-xs">
          Loading your profile...
        </p>
      </div>
    );
  }

  return (
    <div className="font-figtree space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-figtree text-xl md:text-2xl font-bold text-zinc-900 tracking-tight mb-1">
            My Profile
          </h2>
          <p className="font-figtree text-sm md:text-base text-zinc-500 font-medium leading-relaxed">
            Update your personal details and account preferences.
          </p>
        </div>
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="font-figtree px-6 md:px-8 py-3 bg-primary text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-2xl hover:opacity-90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 w-fit disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save size={15} />
          )}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">

        {/* ── Left: Personal Info ── */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8 shadow-sm">

            {/* Section header */}
            <div className="flex items-center gap-3 md:gap-4 border-b border-zinc-100 pb-5 md:pb-6">
              <div className="size-11 md:size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                <User size={22} />
              </div>
              <div>
                <h3 className="font-figtree text-lg md:text-xl font-semibold text-zinc-900 tracking-tight">
                  Personal Information
                </h3>
                <p className="font-figtree text-xs text-zinc-400 font-normal mt-0.5 leading-relaxed">
                  Your basic account details.
                </p>
              </div>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">

              {/* First Name */}
              <div className="space-y-2">
                <label className="font-figtree text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
                  First Name *
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="font-figtree h-12 md:h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all font-bold text-zinc-900 text-base"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="font-figtree text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
                  Last Name
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="font-figtree h-12 md:h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all font-bold text-zinc-900 text-base"
                />
              </div>

              {/* Email — disabled */}
              <div className="space-y-2">
                <label className="font-figtree text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    value={formData.email}
                    disabled
                    className="font-figtree h-12 md:h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold text-zinc-400 pl-11 md:pl-12 cursor-not-allowed text-base"
                  />
                  <Mail
                    className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-zinc-300"
                    size={17}
                  />
                </div>
              </div>

              {/* Phone — disabled */}
              <div className="space-y-2">
                <label className="font-figtree text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    value={formData.phone}
                    disabled
                    className="font-figtree h-12 md:h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold text-zinc-400 pl-11 md:pl-12 cursor-not-allowed text-base"
                  />
                  <Phone
                    className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-zinc-300"
                    size={17}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 font-medium ml-1">To change your phone number, please contact support.</p>
              </div>

            </div>
          </div>
        </div>

        {/* ── Right: Avatar Card ── */}
        <div className="space-y-6 md:space-y-8">
          <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 text-center space-y-5 md:space-y-6 shadow-sm">

            {/* Avatar */}
            <div className="relative size-28 md:size-32 mx-auto">
              <div
                className={`size-28 md:size-32 rounded-[2rem] flex items-center justify-center overflow-hidden relative shadow-md transition-all ${
                  profileImage
                    ? "bg-zinc-50 border-2 border-dashed border-zinc-200"
                    : getAvatarColor(formData.firstName)
                }`}
              >
                {profileImage ? (
                  <Image src={profileImage} alt="Profile" fill className="object-cover" unoptimized />
                ) : (
                  <span className="font-figtree text-[3rem] md:text-[3.5rem] font-bold text-white/95 uppercase drop-shadow-sm">
                    {formData.firstName?.[0] || ""}
                    {formData.lastName?.[0] || ""}
                  </span>
                )}
                {isUploading && (
                  <div
                    className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center ${
                      profileImage ? "bg-white/60" : "bg-black/20"
                    }`}
                  >
                    <Loader2
                      className={`size-7 md:size-8 animate-spin ${
                        profileImage ? "text-primary" : "text-white"
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Camera upload button */}
              <label className="absolute -right-2 -bottom-2 size-9 md:size-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform cursor-pointer">
                <Camera size={16} />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {/* Name */}
            <div className="overflow-hidden">
              <h4 className="font-figtree text-lg md:text-xl font-semibold text-zinc-900 truncate px-2">
                {formData.firstName} {formData.lastName}
              </h4>
              <p className="font-figtree text-xs text-zinc-400 font-normal mt-0.5 truncate px-2">
                {formData.email}
              </p>
            </div>

            {/* Stats */}
            <div className="pt-5 md:pt-6 border-t border-zinc-100 grid grid-cols-2 gap-4">
              <div>
                <p className="font-figtree text-[10px] font-semibold text-zinc-300 uppercase tracking-[0.13em] mb-1">
                  Orders
                </p>
                <p className="font-figtree text-lg font-bold text-zinc-900">
                  {userStats.orders}
                </p>
              </div>
              <div className="border-l border-zinc-100">
                <p className="font-figtree text-[10px] font-semibold text-zinc-300 uppercase tracking-[0.13em] mb-1">
                  Points
                </p>
                <p className="font-figtree text-lg font-bold text-zinc-900">
                  {userStats.points}
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}