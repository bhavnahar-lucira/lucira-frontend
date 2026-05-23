import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";

export default function useCollectionFilters(handle) {
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilters = async () => {
      if (!handle) return;

      try {
        setLoading(true);
        const data = await apiFetch(`/api/collection/filters?handle=${handle}`);
        setFilters(data.filters || {});
      } catch (err) {
        console.error("Error fetching filters:", err);
        toast.error("Failed to load filters");
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, [handle]);

  return { filters, loading };
}
