"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  Trash2,
  Truck,
  Store,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
  Check,
} from "lucide-react";
import CheckoutSummary from "@/components/cart/CheckoutSummary";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  apiFetch,
  createCustomerAddress,
  deleteCustomerAddress,
  fetchCustomerAddresses,
  selectDefaultCustomerAddress,
  updateCustomerAddress,
} from "@/lib/api";
import { selectUser } from "@/redux/features/user/userSlice";
import { useCart } from "@/hooks/useCart";
import { pushAddShippingInfo, pushBeginCheckout } from "@/lib/gtm";
import { sendCheckoutCrmEvent } from "@/lib/checkout-crm";
import { MobileBottomSheet } from "@/components/common/MobileBottomSheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47661824082138";

const emptyAddressForm = {
  firstName: "",
  lastName: "",
  company: "",
  address1: "",
  address2: "",
  city: "",
  province: "",
  zip: "",
  country: "India",
  phone: "",
  gstin: "",
};

const STORES = [];

const PINCODE_COORDS = {
  "400071": { lat: 19.0522, lng: 72.8995 },
  "400064": { lat: 19.186, lng: 72.848 },
  "400092": { lat: 19.231, lng: 72.8521 },
  "411005": { lat: 18.5196, lng: 73.8447 },
  "400001": { lat: 18.9322, lng: 72.8344 }, 
  "110001": { lat: 28.6353, lng: 77.225 }, 
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normalizeAddressForm(address = {}, customer = {}) {
  return {
    ...emptyAddressForm,
    firstName: address.firstName || customer.firstName || "",
    lastName: address.lastName || customer.lastName || "",
    company: address.company || "",
    address1: address.address1 || "",
    address2: address.address2 || "",
    city: address.city || "",
    province: address.province || "",
    zip: address.zip || "",
    country: address.country || "India",
    phone: address.phone || "",
    gstin: address.gstin || "",
  };
}

function formatAddressPreview(address) {
  const pieces = [
    [address.firstName, address.lastName].filter(Boolean).join(" "),
    address.company,
    address.address1,
    address.address2,
    [address.city, address.province, address.zip].filter(Boolean).join(", "),
    address.country,
  ];

  return pieces.filter(Boolean);
}

function AddressFields({ form, onChange, makeDefault, onDefaultChange, submitLabel, onSubmit, saving, isMobile = false }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input placeholder="First name" value={form.firstName} onChange={(e) => onChange("firstName", e.target.value)} className="h-12 border-zinc-200" />
        <Input placeholder="Last name" value={form.lastName} onChange={(e) => onChange("lastName", e.target.value)} className="h-12 border-zinc-200" />
        
        <Input placeholder="Company (optional)" value={form.company} onChange={(e) => onChange("company", e.target.value)} className="h-12 border-zinc-200" />
        {form.country.trim().toLowerCase() === "india" ? (
          <Input
            placeholder="GSTIN (optional)"
            value={form.gstin}
            onChange={(e) => onChange("gstin", e.target.value.toUpperCase())}
            maxLength={15}
            className="h-12 border-zinc-200"
          />
        ) : (
          <div className="hidden" />
        )}
        
        <div className="col-span-2">
          <Input placeholder="Address" value={form.address1} onChange={(e) => onChange("address1", e.target.value)} className="h-12 border-zinc-200" />
        </div>
        <div className="col-span-2">
          <Input placeholder="Apartment, suite, etc. (optional)" value={form.address2} onChange={(e) => onChange("address2", e.target.value)} className="h-12 border-zinc-200" />
        </div>
        
        <Input placeholder="City" value={form.city} onChange={(e) => onChange("city", e.target.value)} className="h-12 border-zinc-200" />
        <Input placeholder="State" value={form.province} onChange={(e) => onChange("province", e.target.value)} className="h-12 border-zinc-200" />
        
        <Input placeholder="PIN code" value={form.zip} onChange={(e) => onChange("zip", e.target.value)} className="h-12 border-zinc-200" />
        <Input placeholder="Country/Region" value={form.country} onChange={(e) => onChange("country", e.target.value)} className="h-12 border-zinc-200" />
        
        <div className="col-span-2">
          <Input
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className="h-12 border-zinc-200"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id={`make-default-${isMobile ? 'mobile' : 'desktop'}`} checked={makeDefault} onCheckedChange={(checked) => onDefaultChange(Boolean(checked))} />
        <label htmlFor={`make-default-${isMobile ? 'mobile' : 'desktop'}`} className="text-sm font-medium text-zinc-700 cursor-pointer">
          Use this as my default shipping address
        </label>
      </div>

      <Button type="button" onClick={onSubmit} disabled={saving} className={`w-full md:w-auto h-14 md:h-12 bg-primary hover:bg-primary/90 text-white font-bold ${isMobile ? 'rounded-full uppercase tracking-widest' : ''}`}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
      </Button>
    </div>
  );
}

const ShippingSkeleton = () => (
  <div className="space-y-10 animate-pulse">
    {/* Delivery Method Skeleton */}
    <div className="space-y-4">
      <div className="h-7 w-48 bg-zinc-200 rounded-md" />
      <div className="h-12 w-full max-w-md bg-zinc-100 rounded-lg" />
    </div>

    {/* Shipping Address Header Skeleton */}
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-zinc-200 rounded-md" />
          <div className="h-4 w-64 bg-zinc-100 rounded-md" />
        </div>
        <div className="h-11 w-44 bg-zinc-100 rounded-lg" />
      </div>

      {/* Address Cards Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-56 w-full border border-zinc-200 rounded-lg bg-white p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="size-5 rounded-full border-2 border-zinc-200" />
                <div className="h-6 w-32 bg-zinc-200 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="size-8 rounded-full bg-zinc-50 border border-zinc-100" />
                <div className="size-8 rounded-full bg-zinc-50 border border-zinc-100" />
              </div>
            </div>
            <div className="pl-9 space-y-2">
              <div className="h-3.5 w-1/2 bg-zinc-100 rounded" />
              <div className="h-3.5 w-3/4 bg-zinc-100 rounded" />
              <div className="h-3.5 w-2/3 bg-zinc-100 rounded" />
              <div className="h-3.5 w-1/2 bg-zinc-100 rounded" />
              <div className="h-3.5 w-1/4 bg-zinc-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SummarySkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="space-y-4">
      <div className="h-7 w-32 bg-zinc-200 rounded-md" />
      <div className="h-80 w-full bg-white rounded-lg border border-zinc-200 p-6 space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="size-20 bg-zinc-100 rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full bg-zinc-100 rounded" />
              <div className="h-3 w-1/2 bg-zinc-50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="h-60 w-full bg-white rounded-lg border border-zinc-200 p-6 space-y-4">
       {[1, 2, 3].map((i) => (
         <div key={i} className="flex justify-between">
           <div className="h-4 w-24 bg-zinc-100 rounded" />
           <div className="h-4 w-16 bg-zinc-100 rounded" />
         </div>
       ))}
       <div className="border-t border-zinc-100 pt-4 flex justify-between">
         <div className="h-6 w-32 bg-zinc-200 rounded" />
         <div className="h-6 w-24 bg-zinc-200 rounded" />
       </div>
    </div>
  </div>
);

export default function ShippingPage() {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { user, accessToken } = useSelector((state) => state.user);
  const { items: cartItems, totalAmount, appliedCoupon, nectorPoints } = useCart();
  const searchParams = useSearchParams();
  const [deliveryMethod, setDeliveryMethod] = useState(searchParams.get("method") || "ship");
  const summaryRef = useRef(null);
  const hasFiredBeginCheckout = useRef(false);

  const [addresses, setAddresses] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [dbStores, setDbStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [searchCoords, setSearchCoords] = useState(null);
  const [tempSelectedStoreId, setTempSelectedStoreId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [dialogSaving, setDialogSaving] = useState(false);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [addressListOpen, setAddressListOpen] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [makeDefault, setMakeDefault] = useState(true);
  const [editingAddressId, setEditingAddressId] = useState("");

  useEffect(() => {
    const currentCustomer = customer || user;
    if (cartItems && cartItems.length > 0 && currentCustomer?.email && !hasFiredBeginCheckout.current) {
      const getNumericId = (gid) => {
        if (!gid) return 0;
        if (typeof gid === 'number') return gid;
        const match = String(gid).match(/\d+$/);
        return match ? Number(match[0]) : 0;
      };

      const checkoutData = {
        payment_type: "Pay Via UPI / COD",
        send_to: "G-K6H0NZ4YJ8",
        value: Number(totalAmount),
        currency: "INR",
        items: cartItems.map((item, idx) => {
          const lowerTitle = (item.title || "").toLowerCase();
          let category = item.type || item.productType || "";
          if (!category) {
            if (lowerTitle.includes("ring")) category = "Rings";
            else if (lowerTitle.includes("earring") || lowerTitle.includes("bali")) category = "Earrings";
            else if (lowerTitle.includes("pendant")) category = "Pendants";
            else if (lowerTitle.includes("bracelet")) category = "Bracelets";
            else if (item.variantId === GOLDCOIN_VARIANT_ID) category = "Gold Coin";
            else if (item.variantId === INSURANCE_VARIANT_ID) category = "Insurance";
          }
          return {
            item_id: getNumericId(item.productId || item.shopifyId || item.id),
            shopify_product_id: item.sku || "",
            variant_id: String(getNumericId(item.variantId)),
            item_name: item.title,
            item_variant: item.variantTitle || `${item.karat || ""} ${item.color || ""}`.trim(),
            item_brand: "Lucira Jewelry",
            item_category: "",
            price: Number(item.price || 0),
            quantity: item.quantity,
            category: category,
            index: idx
          };
        }),
        coupon: (typeof appliedCoupon === 'object' ? appliedCoupon?.code : appliedCoupon) || "NA"
      };

      pushBeginCheckout(checkoutData);

      // Trigger CRM Webhook for Begin Checkout
      sendCheckoutCrmEvent("begin_checkout", {
        email: currentCustomer?.email || "",
        mobile: currentCustomer?.phone || currentCustomer?.mobile || "",
        firstName: currentCustomer?.firstName || currentCustomer?.name?.split(' ')[0] || "",
        lastName: currentCustomer?.lastName || currentCustomer?.name?.split(' ')[1] || "",
        totalCartValue: Number(totalAmount),
        cartItems: cartItems
      });

      hasFiredBeginCheckout.current = true;
    }
  }, [cartItems, totalAmount, appliedCoupon, customer, user]);

  const finalAmount = useMemo(() => {
    const insuranceItem = (cartItems || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
    const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;
    const subtotalValue = (totalAmount || 0) - insuranceValue;

    const couponDetails = typeof appliedCoupon === 'object' ? appliedCoupon : { code: appliedCoupon, value: 0, valueType: "FIXED_AMOUNT" };
    let couponDiscountAmount = 0;
    if (appliedCoupon) {
      if (couponDetails.valueType === "FIXED_AMOUNT") {
        couponDiscountAmount = couponDetails.value;
      } else if (couponDetails.valueType === "PERCENTAGE") {
        couponDiscountAmount = (subtotalValue * couponDetails.value) / 100;
      }
    }

    const pointsDiscountAmount = nectorPoints?.fiat_value || 0;
    return subtotalValue + insuranceValue - couponDiscountAmount - pointsDiscountAmount;
  }, [cartItems, totalAmount, appliedCoupon, nectorPoints]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await apiFetch("/api/stores");
        if (data.stores) {
          const mappedStores = data.stores.map(s => ({
            id: s.shopifyId,
            name: s.name,
            code: s.name,
            address: s.address || "",
            city: s.city || "",
            state: s.provinceCode || s.province || "",
            zip: s.zip || "",
            lat: s.latitude || 0,
            lng: s.longitude || 0,
            readyTime: "Usually ready in 24 hours",
          }));
          setDbStores(mappedStores);
        }
      } catch (err) {
        console.error("Failed to fetch stores:", err);
      }
    };
    fetchStores();
  }, []);

  const scrollToSummary = () => {
    if (summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const hasSavedAddresses = addresses.length > 0;
  const orderedAddresses = useMemo(() => {
    if (!selectedAddressId || addresses.length <= 1) return addresses;

    const selectedIndex = addresses.findIndex((address) => address.id === selectedAddressId);
    if (selectedIndex === -1) return addresses;
    if (selectedIndex <= 1) return addresses;

    const selected = addresses.find((address) => address.id === selectedAddressId);
    if (!selected) return addresses;

    const remaining = addresses.filter((address) => address.id !== selectedAddressId);
    const firstAddress = remaining[0];

    if (!firstAddress) return [selected];

    return [firstAddress, selected, ...remaining.slice(1)];
  }, [addresses, selectedAddressId]);
  const visibleAddresses = orderedAddresses.slice(0, 2);
  const extraAddressCount = Math.max(0, addresses.length - visibleAddresses.length);
  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const sortedStores = useMemo(() => {
    let center = searchCoords;
    
    if (!center && selectedAddress?.zip) {
      center = PINCODE_COORDS[selectedAddress.zip];
    }
    
    if (!center) {
      return [...dbStores];
    }

    return [...dbStores]
      .map((store) => ({
        ...store,
        distance: calculateDistance(center.lat, center.lng, store.lat, store.lng),
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [selectedAddress, searchCoords, dbStores]);

  const storeAvailability = useMemo(() => {
    return sortedStores.reduce((acc, store) => {
      acc[store.id] = cartItems.map((item, index) => ({
        ...item,
        isAvailable: true,
      }));
      return acc;
    }, {});
  }, [sortedStores, cartItems]);

  useEffect(() => {
    if (sortedStores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(sortedStores[0].id);
    }
  }, [sortedStores, selectedStoreId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const selection = {
        deliveryMethod,
        selectedStoreId,
        selectedStore: dbStores.find(s => s.id === selectedStoreId) || null,
        selectedAddress: selectedAddress,
        customerEmail: customer?.email || "techamitjha@gmail.com"
      };
      window.localStorage.setItem("checkout_selection", JSON.stringify(selection));
    }
  }, [deliveryMethod, selectedStoreId, selectedAddress, customer, dbStores]);

  const handleStoreSearch = () => {
    const query = storeSearchQuery.trim();
    if (!query) return;
    
    let coords = PINCODE_COORDS[query];
    
    if (!coords && query.length >= 3) {
      const prefix = query.substring(0, 3);
      const similarPincode = Object.keys(PINCODE_COORDS).find(p => p.startsWith(prefix));
      if (similarPincode) {
        coords = PINCODE_COORDS[similarPincode];
        toast.info(`Showing stores near ${similarPincode} (closest to ${query})`);
      }
    }

    if (coords) {
      setSearchCoords(coords);
      const nearest = [...dbStores]
        .map((store) => ({
          ...store,
          distance: calculateDistance(coords.lat, coords.lng, store.lat, store.lng),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))[0];
      
      if (nearest) {
        setTempSelectedStoreId(nearest.id);
      }
    } else {
      toast.info("No exact location found. Showing all stores. Try 400071, 400092 or 411005.");
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSearchCoords(coords);
        const nearest = [...dbStores]
          .map((store) => ({
            ...store,
            distance: calculateDistance(coords.lat, coords.lng, store.lat, store.lng),
          }))
          .sort((a, b) => (a.distance || 0) - (b.distance || 0))[0];
        
        if (nearest) {
          setTempSelectedStoreId(nearest.id);
        }
        toast.success("Nearby stores updated based on your location");
      },
      () => {
        toast.error("Unable to retrieve your location. Please check permissions.");
      }
    );
  };

  const handleOpenStoreDialog = () => {
    setTempSelectedStoreId(selectedStoreId);
    setShowStoreDialog(true);
  };

  const handleSaveStoreSelection = () => {
    setSelectedStoreId(tempSelectedStoreId);
    setShowStoreDialog(false);
  };

  const [isDeliverable, setIsDeliverable] = useState(true);
  const [checkingPincode, setCheckingPincode] = useState(false);

  const checkPincodeDeliverability = async (pincode) => {
    if (!pincode) return false;
    try {
      const data = await apiFetch(`/api/pincodes/check?pincode=${pincode.trim()}`);
      return data.success && data.deliverable;
    } catch (err) {
      console.error("Pincode check failed:", err);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const checkSelected = async () => {
      if (deliveryMethod === "ship" && selectedAddress?.zip) {
        setCheckingPincode(true);
        const deliverable = await checkPincodeDeliverability(selectedAddress.zip);
        if (isMounted) {
          setIsDeliverable(deliverable);
          setCheckingPincode(false);
        }
      } else {
        if (isMounted) {
          setIsDeliverable(true);
          setCheckingPincode(false);
        }
      }
    };
    checkSelected();
    return () => { isMounted = false; };
  }, [selectedAddress?.zip, deliveryMethod]);

  const applyAddressPayload = (payload) => {
    setAddresses(payload.addresses || []);
    setCustomer(payload.customer || null);

    const nextSelectedId = payload.defaultAddressId || payload.addresses?.[0]?.id || "";
    setSelectedAddressId(nextSelectedId);

    if (typeof window !== "undefined") {
      const currentAddress = (payload.addresses || []).find((address) => address.id === nextSelectedId) || null;
      window.localStorage.setItem(
        "checkoutShippingAddress",
        JSON.stringify({
          customer: payload.customer || null,
          address: currentAddress,
        })
      );
    }
  };

  const loadAddresses = useCallback(async () => {
    try {
      setLoadingAddresses(true);
      applyAddressPayload(await fetchCustomerAddresses(accessToken));
    } catch (error) {
      toast.error(error.message || "Unable to load saved addresses");
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const updateForm = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!addressForm.firstName.trim()) return "First name is required";
    if (!addressForm.lastName.trim()) return "Last name is required";
    if (!addressForm.address1.trim()) return "Address is required";
    if (!addressForm.city.trim()) return "City is required";
    if (!addressForm.province.trim()) return "State is required";
    if (!addressForm.zip.trim()) return "PIN code is required";
    
    if (!/^\d{6}$/.test(addressForm.zip.trim())) {
      return "Please enter a valid 6-digit PIN code";
    }

    if (!addressForm.country.trim()) return "Country is required";
    if (addressForm.gstin.trim() && addressForm.gstin.trim().length !== 15) {
      return "GSTIN must be 15 characters";
    }
    return "";
  };

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingAddressId("");
    setAddressForm(normalizeAddressForm({}, customer || {}));
    setMakeDefault(!hasSavedAddresses);
    setDialogOpen(true);
  };

  const openEditDialog = (address) => {
    setDialogMode("edit");
    setEditingAddressId(address.id);
    setAddressForm(normalizeAddressForm(address, customer || {}));
    setMakeDefault(Boolean(address.isDefault));
    setDialogOpen(true);
  };

  const handleCreateAddress = async (useDialog = false) => {
    const validationError = validateForm();
    if (validationError) return toast.error(validationError);

    try {
      if (useDialog) setDialogSaving(true);
      else setInlineSaving(true);

      const deliverable = await checkPincodeDeliverability(addressForm.zip.trim());
      if (!deliverable) {
        return toast.error("We are not delivering product on this address");
      }

      applyAddressPayload(
        await createCustomerAddress({
          address: addressForm,
          makeDefault,
        })
      );
      toast.success("Address added");
      if (useDialog) setDialogOpen(false);
    } catch (error) {
      toast.error(error.message || "Unable to add address");
    } finally {
      if (useDialog) setDialogSaving(false);
      else setInlineSaving(false);
    }
  };

  const handleUpdateAddress = async () => {
    const validationError = validateForm();
    if (validationError) return toast.error(validationError);

    try {
      setDialogSaving(true);

      const deliverable = await checkPincodeDeliverability(addressForm.zip.trim());
      if (!deliverable) {
        return toast.error("We are not delivering product on this address");
      }

      applyAddressPayload(
        await updateCustomerAddress({
          addressId: editingAddressId,
          address: addressForm,
          makeDefault,
        })
      );
      setDialogOpen(false);
      toast.success("Address updated");
    } catch (error) {
      toast.error(error.message || "Unable to update address");
    } finally {
      setDialogSaving(false);
    }
  };

  const handleSelectAddress = async (addressId) => {
    const addressToSelect = addresses.find(a => a.id === addressId);
    if (addressToSelect?.isDefault) {
      toast.info("This address is already default");
      setSelectedAddressId(addressId);
      return;
    }

    setSelectedAddressId(addressId);
    try {
      applyAddressPayload(await selectDefaultCustomerAddress(addressId));
    } catch (error) {
      toast.error(error.message || "Unable to select address");
      loadAddresses();
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const addressToDelete = addresses.find(a => a.id === addressId);
    if (addressToDelete?.isDefault) {
      return toast.error("You cannot delete default address");
    }
    try {
      applyAddressPayload(await deleteCustomerAddress(addressId, accessToken));
      toast.success("Address removed");
    } catch (error) {
      toast.error(error.message || "Unable to remove address");
    }
  };

  const selectedStore = dbStores.find(s => s.id === selectedStoreId) || sortedStores[0];

  const handleContinueToPayment = () => {
    const getNumericId = (gid) => {
      if (!gid) return 0;
      if (typeof gid === 'number') return gid;
      const match = String(gid).match(/\d+$/);
      return match ? Number(match[0]) : 0;
    };

    const insuranceItem = (cartItems || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
    const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;
    const subtotalValue = (totalAmount || 0) - insuranceValue;

    const couponDetails = typeof appliedCoupon === 'object' ? appliedCoupon : { code: appliedCoupon, value: 0, valueType: "FIXED_AMOUNT" };
    let couponDiscountAmount = 0;
    if (appliedCoupon) {
      if (couponDetails.valueType === "FIXED_AMOUNT") {
        couponDiscountAmount = couponDetails.value;
      } else if (couponDetails.valueType === "PERCENTAGE") {
        couponDiscountAmount = (subtotalValue * couponDetails.value) / 100;
      }
    }

    const pointsDiscountAmount = nectorPoints?.fiat_value || 0;
    const grandTotalValue = subtotalValue + insuranceValue - couponDiscountAmount - pointsDiscountAmount;

    const shippingData = {
      value: grandTotalValue,
      currency: "INR",
      items: (cartItems || []).map((item, idx) => {
        const lowerTitle = (item.title || "").toLowerCase();
        let category = item.type || item.productType || "";
        if (!category) {
          if (lowerTitle.includes("ring")) category = "Rings";
          else if (lowerTitle.includes("earring") || lowerTitle.includes("bali")) category = "Earrings";
          else if (lowerTitle.includes("pendant")) category = "Pendants";
          else if (lowerTitle.includes("bracelet")) category = "Bracelets";
          else if (item.variantId === GOLDCOIN_VARIANT_ID) category = "Gold Coin";
          else if (item.variantId === INSURANCE_VARIANT_ID) category = "Insurance";
        }

        return {
          item_id: getNumericId(item.productId || item.shopifyId || item.id),
          item_name: item.title,
          item_variant: item.variantTitle || "",
          item_brand: "Lucira Jewelry",
          item_category: "",
          price: Number(item.price || 0),
          quantity: item.quantity,
          category: category,
          index: idx
        };
      }),
      coupon: couponDetails?.code || "NA"
    };

    pushAddShippingInfo(shippingData);
  };

  const StorePickupContent = () => (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <button onClick={handleUseMyLocation} className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:underline">
          <Navigation size={16} />
          Use my location
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-zinc-500">
          There are {sortedStores.length} locations with your item
        </p>

        <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {sortedStores.map((store) => {
            const isSelected = tempSelectedStoreId === store.id;
            return (
              <div
                key={store.id}
                onClick={() => setTempSelectedStoreId(store.id)}
                className={`relative flex items-start gap-4 p-5 rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected ? "border-accent bg-accent/10 shadow-sm" : "border-zinc-100 hover:border-zinc-200"
                }`}
              >
                <div className={`mt-1 size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isSelected ? "border-accent bg-accent/10" : "border-zinc-300"
                }`}>
                  {isSelected && <div className="size-2 rounded-full bg-white" />}
                </div>
                
                <div className="grow space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-zinc-900">{store.code || store.name}</h3>
                    <span className="font-bold text-zinc-900 text-sm">FREE</span>
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed pr-8">
                    {store.address}, {store.city} {store.state}
                  </p>
                  {/* <div className="flex items-center gap-2 text-zinc-400 text-base">
                    <Clock size={14} />
                    <span>{store.readyTime}</span>
                  </div> */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const AddressListContent = () => (
    <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
      {addresses.map((address) => {
        const isSelected = selectedAddressId === address.id;
        return (
          <div
            key={`all-${address.id}`}
            onClick={async () => {
              await handleSelectAddress(address.id);
              setAddressListOpen(false);
            }}
            role="button"
            tabIndex={0}
            className={`rounded-lg border p-4 text-left transition-all ${
              isSelected ? "border-primary bg-[#FFF8F4]" : "border-zinc-200 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="all-shipping-addresses"
                checked={isSelected}
                onChange={() => {}}
                className="mt-1 size-4 accent-black"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900">
                      {[address.firstName, address.lastName].filter(Boolean).join(" ") || "Saved address"}
                    </h3>
                    {address.isDefault && (
                      <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                        Default
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={address.isDefault}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleDeleteAddress(address.id);
                    }}
                    className={`rounded-full border border-zinc-200 p-2 text-zinc-600 transition ${address.isDefault ? "opacity-50 cursor-not-allowed" : "hover:border-red-200 hover:text-red-600"}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 space-y-1 text-sm text-zinc-600">
                  {formatAddressPreview(address).map((line) => (
                    <p key={`list-${address.id}-${line}`}>{line}</p>
                  ))}
                  {address.gstin && <p className="font-medium text-zinc-800">GSTIN: {address.gstin}</p>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const isLoading = loadingAddresses;

  const isContinueDisabled = deliveryMethod === "ship" 
    ? (!selectedAddress || !isDeliverable || checkingPincode) 
    : !selectedStoreId;

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl w-full mx-auto px-4">
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
            <div className="grow lg:basis-[60%] lg:shrink-0 py-10 px-4 lg:pr-12">
              <ShippingSkeleton />
            </div>
            <div className="w-full lg:basis-[40%] lg:shrink-0 py-10 px-4 lg:pl-12 bg-[#FAFAFA]">
              <SummarySkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      <div className="max-w-7xl w-full mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
          <div className="grow lg:basis-[60%] lg:shrink-0 lg:py-10 px-4 lg:pr-12 space-y-10 bg-white">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 font-abhaya">Delivery method</h2>
              <div className="flex p-1 bg-zinc-100 rounded-lg w-full max-w-md">
                <button
                  onClick={() => setDeliveryMethod("ship")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-bold transition-all ${
                    deliveryMethod === "ship" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  <Truck size={18} />
                  Ship
                </button>
                <button
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-bold transition-all ${
                    deliveryMethod === "pickup" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  <MapPin size={18} />
                  Pickup
                </button>
              </div>
            </div>

            {deliveryMethod === "ship" ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {loadingAddresses ? (
                  <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-6 text-zinc-600">
                    <Loader2 className="size-5 animate-spin" />
                    Loading saved addresses...
                  </div>
                ) : hasSavedAddresses ? (
                  <>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="font-abhaya text-xl font-bold text-zinc-900">Shipping address</h2>
                        <p className="font-figtree text-sm text-zinc-500">Select one of your saved addresses below.</p>
                      </div>
                      <Button type="button" variant="outline" onClick={openCreateDialog} className="h-11 bg-accent border-accent text-white hover:shadow-lg">
                        <Plus className="size-4" />
                        Add new address
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {visibleAddresses.map((address) => {
                        const isSelected = selectedAddressId === address.id;
                        return (
                          <div
                            key={address.id}
                            onClick={() => handleSelectAddress(address.id)}
                            role="button"
                            tabIndex={0}
                            className={`w-full rounded-lg border p-5 text-left transition-all ${
                              isSelected ? "border-accent bg-accent/10" : "border-zinc-200 bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <input type="radio" name="shipping-address" checked={isSelected} onChange={() => handleSelectAddress(address.id)} className="mt-1 size-4 accent-black" />
                              <div className="flex-1 space-y-3">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-zinc-900">
                                        {[address.firstName, address.lastName].filter(Boolean).join(" ") || "Saved address"}
                                      </h3>
                                      {address.isDefault && (
                                        <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-2 space-y-1 text-sm text-zinc-600">
                                      {formatAddressPreview(address).map((line) => (
                                        <p key={`${address.id}-${line}`}>{line}</p>
                                      ))}
                                      {address.gstin && <p className="font-medium text-zinc-800">GSTIN: {address.gstin}</p>}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button type="button" onClick={(e) => {
                                      e.stopPropagation();
                                      openEditDialog(address);
                                    }} className="rounded-full bg-white shadow border border-zinc-100 p-2 text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900">
                                      <Pencil className="size-4" />
                                    </button>
                                    <button type="button" disabled={address.isDefault} onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAddress(address.id);
                                    }} className={`rounded-full bg-white shadow border border-zinc-100 p-2 text-zinc-600 transition ${address.isDefault ? "opacity-50 cursor-not-allowed" : "hover:border-red-200 hover:text-red-600"}`}>
                                      <Trash2 className="size-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!isDeliverable && selectedAddress && !checkingPincode && (
                      <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2 duration-300">
                        <XCircle className="size-5 shrink-0" />
                        <p className="text-sm font-bold uppercase tracking-tight">We are not delivering product on this address</p>
                      </div>
                    )}

                    {extraAddressCount > 0 && (
                      <div className="flex justify-end -mt-1">
                        <button
                          type="button"
                          onClick={() => setAddressListOpen(true)}
                          className="text-sm font-medium text-[#005BD3] hover:underline"
                        >
                          More addresses ({extraAddressCount})
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900">Shipping address</h2>
                      <p className="text-sm text-zinc-500 mt-1">
                        You do not have a saved address yet. Add one to continue.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 p-6">
                      <AddressFields
                        form={addressForm}
                        onChange={updateForm}
                        makeDefault={makeDefault}
                        onDefaultChange={setMakeDefault}
                        submitLabel="Save address"
                        onSubmit={() => handleCreateAddress(false)}
                        saving={inlineSaving}
                      />
                    </div>
                  </div>
                )}

                <div className="hidden lg:flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                  <Link href="/checkout/cart" className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:opacity-80 transition-opacity">
                    <ChevronLeft className="size-4" />
                    Return to cart
                  </Link>
                  <Button 
                    disabled={isContinueDisabled}
                    onClick={() => {
                      if (isContinueDisabled) {
                        toast.error("Please select a valid shipping address");
                        return;
                      }
                      handleContinueToPayment();
                      router.push("/checkout/payment");
                    }} 
                    className="w-full md:w-70 h-13.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all text-[15px] uppercase tracking-wider"
                  >
                    CONTINUE TO PAYMENT
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                      There are {sortedStores.length} locations with your item
                    </p>
                    <button onClick={handleOpenStoreDialog} className="flex items-center gap-1.5 text-sm text-primary font-bold hover:underline">
                      <Navigation size={14} />
                      India
                    </button>
                  </div>
                </div>

                <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  {selectedStore && (
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-zinc-900 text-base">{selectedStore.code}</h3>
                        <span className="font-bold text-zinc-900 text-sm">FREE</span>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm text-zinc-500 leading-relaxed max-w-100">
                          {selectedStore.address}, {selectedStore.city} {selectedStore.state}
                        </p>
                        {/* <div className="flex items-center gap-2 text-zinc-500 text-sm">
                          <Clock size={16} />
                          <span>{selectedStore.readyTime}</span>
                        </div> */}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleOpenStoreDialog}
                    className="w-full flex items-center justify-between px-6 py-4 border-t border-zinc-100 hover:bg-zinc-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-zinc-700">
                      {sortedStores.length - 1} more locations
                    </span>
                    <ChevronRight size={16} className="text-zinc-700" />
                  </button>
                </div>

                <div className="hidden lg:flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                  <Link href="/checkout/cart" className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:opacity-80 transition-opacity">
                    <ChevronLeft className="size-4" />
                    Return to cart
                  </Link>
                  <Button 
                    disabled={!selectedStoreId} 
                    onClick={() => {
                      handleContinueToPayment();
                      router.push("/checkout/payment");
                    }}
                    className="w-full md:w-70 h-13.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all text-[15px] uppercase tracking-wider"
                  >
                    CONTINUE TO PAYMENT
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:basis-[40%] lg:shrink-0 relative">
            <div className="hidden lg:block absolute inset-y-0 left-0 w-screen bg-[#FAFAFA] border-l border-zinc-100 z-0" />
              <div className="relative z-10 py-10 px-4 lg:pl-12 mb-10 lg:bg-transparent min-h-full bg-[#FAFAFA]" ref={summaryRef}>
                <div className="lg:sticky lg:top-0">
                  <CheckoutSummary />
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.08)] z-60">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-zinc-900 leading-none">₹ {finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <button 
              onClick={scrollToSummary}
              className="text-[11px] font-bold text-accent uppercase tracking-tight mt-1 text-left whitespace-nowrap"
            >
              View Summary
            </button>
          </div>
          <Link href="/checkout/payment" className={`grow ${isContinueDisabled ? "pointer-events-none opacity-50" : ""}`} onClick={handleContinueToPayment}>
             <Button 
              disabled={isContinueDisabled}
              className="w-full bg-primary hover:bg-accent text-white font-bold h-12 uppercase tracking-widest rounded-lg text-sm"
            >
              Continue to payment
            </Button>
          </Link>
        </div>
      </div>

      {/* POPUPS */}
      {isDesktop ? (
        <>
          {/* STORE PICKUP DIALOG */}
          <Dialog open={showStoreDialog} onOpenChange={setShowStoreDialog}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-lg border-none">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-xl font-bold text-zinc-900">Pickup locations</DialogTitle>
              </DialogHeader>
              <StorePickupContent />
              <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => setShowStoreDialog(false)} className="px-8 h-12 border-zinc-200 text-zinc-600 font-bold">Cancel</Button>
                <Button onClick={handleSaveStoreSelection} className="px-10 h-12 bg-primary hover:bg-primary/90 text-white font-bold">Save</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* ADDRESS FORM DIALOG */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{dialogMode === "edit" ? "Edit address" : "Add new address"}</DialogTitle>
                <DialogDescription>Email and phone stay tied to your account.</DialogDescription>
              </DialogHeader>
              <AddressFields
                form={addressForm}
                onChange={updateForm}
                makeDefault={makeDefault}
                onDefaultChange={setMakeDefault}
                submitLabel={dialogMode === "edit" ? "Save changes" : "Save address"}
                onSubmit={dialogMode === "edit" ? handleUpdateAddress : () => handleCreateAddress(true)}
                saving={dialogSaving}
              />
            </DialogContent>
          </Dialog>

          {/* ADDRESS LIST DIALOG */}
          <Dialog open={addressListOpen} onOpenChange={setAddressListOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>All addresses</DialogTitle>
                <DialogDescription>Select a default shipping address.</DialogDescription>
              </DialogHeader>
              <AddressListContent />
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <>
          <MobileBottomSheet isOpen={showStoreDialog} onClose={() => setShowStoreDialog(false)} title="Pickup locations" footer={<Button onClick={handleSaveStoreSelection} className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-full uppercase tracking-widest">SAVE LOCATION</Button>}>
            <StorePickupContent />
          </MobileBottomSheet>

          <MobileBottomSheet isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title={dialogMode === "edit" ? "Edit address" : "Add new address"}>
            <AddressFields
              form={addressForm}
              onChange={updateForm}
              makeDefault={makeDefault}
              onDefaultChange={setMakeDefault}
              submitLabel={dialogMode === "edit" ? "SAVE CHANGES" : "SAVE ADDRESS"}
              onSubmit={dialogMode === "edit" ? handleUpdateAddress : () => handleCreateAddress(true)}
              saving={dialogSaving}
              isMobile={true}
            />
          </MobileBottomSheet>

          <MobileBottomSheet isOpen={addressListOpen} onClose={() => setAddressListOpen(false)} title="All addresses">
            <AddressListContent />
          </MobileBottomSheet>
        </>
      )}
    </div>
  );
}

