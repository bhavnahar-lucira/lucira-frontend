"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { apiFetch } from "@/lib/api";
import { shopifyStorefrontFetch, CUSTOMER_QUERY, CUSTOMER_UPDATE_MUTATION } from "@/lib/shopify-client";

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
  const { accessToken } = useSelector((state) => state.user);
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
      if (!accessToken) {
        setLoading(false);
        router.push("/login");
        return;
      }

      try {
        setLoading(true);

        // Hybrid Strategy: Try backend first, fallback to Storefront API
        let customerData = null;
        try {
          const data = await apiFetch("/api/customer/profile");
          if (data && data.customer) {
            customerData = data.customer;
          } else {
            throw new Error("Empty backend profile");
          }
        } catch (backendErr) {
          console.warn("[MyProfilePage] Backend profile fetch failed, falling back to Storefront API:", backendErr);
          
          if (accessToken && !accessToken.startsWith("simulated_")) {
            const storefrontData = await shopifyStorefrontFetch(CUSTOMER_QUERY, {
              customerAccessToken: accessToken
            });
            customerData = storefrontData?.customer;
          }
        }

        if (customerData) {
          if (process.env.NODE_ENV === "development") {
            console.log("[MyProfilePage] Found customer data:", customerData);
          }
          setFormData({
            firstName: customerData.firstName || customerData.first_name || "",
            lastName: customerData.lastName || customerData.last_name || "",
            email: customerData.email || "",
            phone: customerData.phone || "",
          });
        } else {
          console.warn("[MyProfilePage] Could not retrieve customer data from any source.");
        }

        try {
          const avData = await apiFetch("/api/customer/profile/avatar");
          if (avData.avatar) setProfileImage(avData.avatar);
        } catch (e) {
          console.warn("[MyProfilePage] Failed to load avatar", e);
        }

        try {
          const [sData, oData] = await Promise.all([
            apiFetch("/api/customer/dashboard-stats").catch(e => {
              console.warn("[MyProfilePage] Failed to load stats", e);
              return { points: 0 };
            }),
            apiFetch("/api/customer/orders").catch(e => {
              console.warn("[MyProfilePage] Failed to load orders", e);
              return { orders: [] };
            })
          ]);

          const pBal = sData?.points !== undefined ? sData.points.toLocaleString() : "0";
          const oCount = oData?.orders?.length?.toString() || "0";
          setUserStats({ orders: oCount, points: pBal });
        } catch (e) {
          console.warn("[MyProfilePage] Failed to load stats or orders", e);
        }
      } catch (err) {
        console.error("[MyProfilePage] Unexpected error during profile load:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [accessToken, dispatch, router]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!formData.firstName || !formData.email || !formData.phone) {
      toast.error("First name, email and phone are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    let phoneToValidate = formData.phone.replace(/\D/g, "");
    // If it starts with 91 and has 12 digits, we treat the remaining 10 as the core number
    if (phoneToValidate.startsWith("91") && phoneToValidate.length === 12) {
      phoneToValidate = phoneToValidate.substring(2);
    }

    if (phoneToValidate.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      setIsSaving(true);
      
      // 1. Update backend (MongoDB + other logic)
      await apiFetch("/api/customer/profile", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        }),
      });

      // 2. Direct Shopify Update (Mirroring the way first/last name are handled)
      if (accessToken && !accessToken.startsWith("simulated_")) {
        const shopifyUpdate = await shopifyStorefrontFetch(CUSTOMER_UPDATE_MUTATION, {
          customerAccessToken: accessToken,
          customer: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          }
        });

        if (shopifyUpdate?.customerUpdate?.customerUserErrors?.length > 0) {
          const error = shopifyUpdate.customerUpdate.customerUserErrors[0];
          console.error("[MyProfilePage] Shopify Update Error:", error);
          if (error.field?.includes("email")) {
            toast.warn(`Profile saved, but email update in Shopify failed: ${error.message}`);
          }
        }
      }

      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.message || "Update failed");
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
      const result = await apiFetch("/api/customer/profile/avatar", {
        method: "POST",
        body: data,
      });
      const imageUrl = result.url + (result.url.includes("?") ? "&" : "?") + "t=" + Date.now();
      setProfileImage(imageUrl);
      toast.success("Profile image updated");
      window.dispatchEvent(new Event("profile-updated"));
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
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8 shadow-sm">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
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

              <div className="space-y-2">
                <label className="font-figtree text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="font-figtree h-12 md:h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all font-bold text-zinc-900 text-base pl-11 md:pl-12"
                  />
                  <Mail
                    className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-zinc-300"
                    size={17}
                  />
                </div>
                
              </div>

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
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 md:p-8 text-center space-y-5 md:space-y-6 shadow-sm">
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

            <div className="overflow-hidden">
              <h4 className="font-figtree text-lg md:text-xl font-semibold text-zinc-900 truncate px-2">
                {formData.firstName} {formData.lastName}
              </h4>
              <p className="font-figtree text-xs text-zinc-400 font-normal mt-0.5 truncate px-2">
                {formData.email}
              </p>
            </div>

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
