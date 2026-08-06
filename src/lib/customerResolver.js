import { shopifyAdminFetch } from "@/lib/shopify";

const VERIFY_CUSTOMER_QUERY = `
  query VerifyCustomer($id: ID!) {
    customer(id: $id) {
      id
    }
  }
`;

const FIND_CUSTOMER_QUERY = `
  query FindCustomer($query: String!) {
    customers(first: 1, query: $query) {
      nodes {
        id
      }
    }
  }
`;

const noCache = { next: { revalidate: 0 } };

const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");

// The register response can hand us a gid, a numeric Shopify id, or (for
// non-Shopify backends) an opaque id. Anything that is not clearly a Shopify
// customer id falls through to an email/phone lookup.
export async function resolveCustomerGid({ customerId, email, mobile }) {
  const raw = String(customerId ?? "").trim();
  const numeric = raw.startsWith("gid://shopify/Customer/")
    ? raw.split("/").pop()
    : /^\d+$/.test(raw)
      ? raw
      : "";

  if (numeric) {
    try {
      const data = await shopifyAdminFetch(
        VERIFY_CUSTOMER_QUERY,
        { id: `gid://shopify/Customer/${numeric}` },
        noCache
      );
      if (data?.customer?.id) return data.customer.id;
    } catch (err) {
      console.warn("[customerResolver] Customer id lookup failed:", err.message);
    }
  }

  const searches = [];
  const cleanEmail = String(email ?? "").trim();
  if (cleanEmail) searches.push(`email:${JSON.stringify(cleanEmail)}`);

  const phone = digitsOnly(mobile);
  if (phone.length >= 10) {
    const last10 = phone.slice(-10);
    searches.push(`phone:+91${last10}`, `phone:${last10}`);
  }

  for (const query of searches) {
    try {
      const data = await shopifyAdminFetch(FIND_CUSTOMER_QUERY, { query }, noCache);
      const found = data?.customers?.nodes?.[0]?.id;
      if (found) return found;
    } catch (err) {
      console.warn(`[customerResolver] Customer search failed (${query}):`, err.message);
    }
  }

  return null;
}
