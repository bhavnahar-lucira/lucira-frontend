import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { ALL_STORES } from "@/app/(frontend)/pages/store-locator/StoreLocatorClient";

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

export function getDirectionsUrl(store) {
  if (!store) return "";
  if (store.lat && store.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`;
  }
  const query = [store.address, store.city, store.state].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function ordinalSuffix(day) {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatPickupReadyDate(daysFromNow = 3) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day}${ordinalSuffix(day)} ${month}`;
}

export function useStorePickup({ selectedShippingZip } = {}) {
  const [dbStores, setDbStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [tempSelectedStoreId, setTempSelectedStoreId] = useState("");
  const [pincodeQuery, setPincodeQuery] = useState("");
  const [searchCoords, setSearchCoords] = useState(null);
  const [hasResolvedStore, setHasResolvedStore] = useState(false);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await apiFetch("/api/stores");
        if (data && data.stores && data.stores.length > 0) {
          setDbStores(
            data.stores.map((s) => {
              // Dynamically cross-reference ALL_STORES from StoreLocatorClient
              // to find matching phone numbers so there is a single source of truth.
              const sName = s.name.toLowerCase();
              const matchedLocatorStore = ALL_STORES.find(store => 
                store.name.toLowerCase().includes(sName) || 
                sName.includes(store.city.toLowerCase()) || 
                (store.designLink && store.designLink.includes(sName))
              );
              
              let phoneStr = s.phone || (matchedLocatorStore ? matchedLocatorStore.callLink.replace("tel:", "") : "");
              
              return {
                id: s.shopifyId,
                name: s.name,
                code: s.name,
                address: s.address || "",
                city: s.city || "",
                state: s.provinceCode || s.province || "",
                zip: s.zip || "",
                lat: s.latitude || 0,
                lng: s.longitude || 0,
                phone: phoneStr,
                readyTime: "Usually ready in 24 hours",
              };
            })
          );
          return;
        }
      } catch (err) {
        console.error("Failed to fetch stores, falling back to local list:", err);
      }
      
      // Fallback if API fails or returns no stores
      setDbStores(
        ALL_STORES.map((s, index) => {
          // Extract pincode from address if available (6 digit number at end)
          const zipMatch = s.address?.match(/\b\d{6}\b/);
          return {
            id: `store-${index}`,
            name: s.name,
            code: s.name,
            address: s.address || "",
            city: s.city || "",
            state: s.address?.includes("Maharashtra") ? "Maharashtra" : s.address?.includes("Delhi") ? "Delhi" : "",
            zip: zipMatch ? zipMatch[0] : "",
            lat: s.lat || 0,
            lng: s.lng || 0,
            phone: s.callLink ? s.callLink.replace("tel:", "") : "",
            readyTime: "Usually ready in 24 hours",
          };
        })
      );
    };
    fetchStores();
  }, []);

  const sortedStores = useMemo(() => {
    let center = searchCoords;

    if (!center && selectedShippingZip) {
      center = PINCODE_COORDS[selectedShippingZip];
    }

    if (!center) return [...dbStores];

    return [...dbStores]
      .map((store) => ({ ...store, distance: calculateDistance(center.lat, center.lng, store.lat, store.lng) }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [selectedShippingZip, searchCoords, dbStores]);

  const resolveNearestFrom = useCallback(
    (coords) => {
      const nearest = [...dbStores]
        .map((store) => ({ ...store, distance: calculateDistance(coords.lat, coords.lng, store.lat, store.lng) }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))[0];
      return nearest || null;
    },
    [dbStores]
  );

  const findNearestByPincode = useCallback(async () => {
    const query = pincodeQuery.trim();
    if (!query) {
      toast.error("Enter a PIN code to find nearby stores");
      return;
    }

    let coords;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(query)}&country=india&format=json`);
      const data = await res.json();
      if (data && data.length > 0) {
        coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      console.error("OSM error:", e);
    }

    if (!coords) {
      coords = PINCODE_COORDS[query];
    }

    if (!coords && query.length >= 3) {
      const prefix = query.substring(0, 3);
      const similarPincode = Object.keys(PINCODE_COORDS).find((p) => p.startsWith(prefix));
      if (similarPincode) {
        coords = PINCODE_COORDS[similarPincode];
        toast.info(`Showing stores near ${similarPincode} (closest to ${query})`);
      }
    }

    if (!coords) {
      toast.error("No exact location found. Try entering a valid pincode.");
      return;
    }

    setSearchCoords(coords);
    const nearest = resolveNearestFrom(coords);
    if (nearest) {
      setSelectedStoreId(nearest.id);
      setTempSelectedStoreId(nearest.id);
      setHasResolvedStore(true);
    }
  }, [pincodeQuery, resolveNearestFrom]);

  const findNearestByGeolocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setSearchCoords(coords);
        const nearest = resolveNearestFrom(coords);
        if (nearest) {
          setSelectedStoreId(nearest.id);
          setTempSelectedStoreId(nearest.id);
          setHasResolvedStore(true);
        }
        toast.success("Nearby stores updated based on your location");
      },
      () => {
        toast.error("Unable to retrieve your location. Please check permissions.");
      }
    );
  }, [resolveNearestFrom]);

  const findNearestStore = useCallback(async () => {
    if (pincodeQuery.trim()) {
      await findNearestByPincode();
      return;
    }
    findNearestByGeolocation();
  }, [pincodeQuery, findNearestByPincode, findNearestByGeolocation]);

  const openStoreDialog = () => {
    setTempSelectedStoreId(selectedStoreId || (sortedStores.length > 0 ? sortedStores[0].id : ""));
    setShowStoreDialog(true);
  };

  const saveStoreSelection = () => {
    if (tempSelectedStoreId) {
      setSelectedStoreId(tempSelectedStoreId);
      setHasResolvedStore(true);
    }
    setShowStoreDialog(false);
  };

  const selectedStore = dbStores.find((s) => s.id === selectedStoreId) || sortedStores[0] || null;

  return {
    dbStores,
    sortedStores,
    selectedStoreId,
    selectedStore,
    showStoreDialog,
    setShowStoreDialog,
    tempSelectedStoreId,
    setTempSelectedStoreId,
    pincodeQuery,
    setPincodeQuery,
    hasResolvedStore,
    findNearestStore,
    findNearestByGeolocation,
    openStoreDialog,
    saveStoreSelection,
  };
}
