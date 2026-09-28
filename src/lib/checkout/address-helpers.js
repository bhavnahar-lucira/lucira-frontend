import { toTenDigit } from "@/lib/phone";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export const emptyAddressForm = {
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
  email: "",
  gstin: "",
};

export function normalizeAddressForm(address = {}, customer = {}) {
  let rawPhone = address.phone || customer.phone || customer.phoneNumber || customer.mobile || "";
  let phone = toTenDigit(rawPhone);

  // Extract GSTIN from company field if it was packed there
  let rawCompany = address.company || "";
  let extractedGstin = "";
  const gstinMatch = rawCompany.match(/(?: - )?\(?GSTIN:\s*([A-Z0-9]{15})\)?$/i);
  if (gstinMatch) {
    extractedGstin = gstinMatch[1];
    rawCompany = rawCompany.replace(gstinMatch[0], "").trim();
  }

  return {
    ...emptyAddressForm,
    firstName: address.firstName || customer.firstName || customer.first_name || "",
    lastName: address.lastName || customer.lastName || customer.last_name || "",
    company: rawCompany,
    address1: address.address1 || "",
    address2: address.address2 || "",
    city: address.city || "",
    province: address.province || "",
    zip: address.zip || "",
    country: address.country || "India",
    phone: phone,
    email: address.email || customer.email || "",
    gstin: address.gstin || extractedGstin || "",
  };
}

export function formatAddressLines(address) {
  if (!address) return [];

  return [
    [address.firstName, address.lastName].filter(Boolean).join(" "),
    address.company,
    address.address1,
    address.address2,
    [address.city, address.province, address.zip].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
}

export function validateAddressForm(form = {}) {
  if (!form.firstName?.trim()) return "First name is required";
  if (!form.lastName?.trim()) return "Last name is required";
  if (!form.address1?.trim()) return "Address is required";
  if (!form.city?.trim()) return "City is required";
  if (!form.province?.trim()) return "State is required";
  if (!form.zip?.trim()) return "PIN code is required";

  if (!/^\d{6}$/.test(form.zip?.trim() || "")) {
    return "Please enter a valid 6-digit PIN code";
  }

  if (!form.country?.trim()) return "Country is required";

  const cleanPhone = (form.phone || "").replace(/\D/g, "");
  if (!cleanPhone) {
    return "Phone number is required";
  }
  if (cleanPhone.length !== 10) {
    return "Phone number must be exactly 10 digits";
  }
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return "Please enter a valid 10-digit Indian mobile number";
  }

  if (form.gstin?.trim()) {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(form.gstin.trim())) {
      return "Please enter a valid 15-digit GSTIN";
    }
  }

  return "";
}

