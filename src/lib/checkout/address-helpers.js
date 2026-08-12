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
  let phone = address.phone || customer.phone || customer.phoneNumber || customer.mobile || "";
  if (phone.startsWith("+91")) {
    phone = phone.replace("+91", "").trim();
  } else if (phone.startsWith("91") && phone.length === 12) {
    phone = phone.substring(2).trim();
  }

  return {
    ...emptyAddressForm,
    firstName: address.firstName || customer.firstName || customer.first_name || "",
    lastName: address.lastName || customer.lastName || customer.last_name || "",
    company: address.company || "",
    address1: address.address1 || "",
    address2: address.address2 || "",
    city: address.city || "",
    province: address.province || "",
    zip: address.zip || "",
    country: address.country || "India",
    phone: phone,
    email: address.email || customer.email || "",
    gstin: address.gstin || "",
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
