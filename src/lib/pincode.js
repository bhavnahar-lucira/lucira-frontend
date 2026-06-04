export async function getPincodeDetails(pincode) {
  try {
    if (!pincode || pincode.length !== 6) return null;

    const response = await fetch(
      `/api/pincode?pincode=${pincode}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const result = data?.[0];

    if (
      !result ||
      result.Status !== "Success" ||
      !Array.isArray(result.PostOffice) ||
      result.PostOffice.length === 0
    ) {
      return null;
    }

    const office = result.PostOffice[0];

    return {
      city: office.District || "",
      province: office.State || "",
      country: office.Country || "India",
      district: office.District || "",
      pincode: office.Pincode || "",
      postOffices: result.PostOffice.map((po) => ({
        name: po.Name,
        district: po.District,
        state: po.State,
        pincode: po.Pincode,
      })),
    };
  } catch (error) {
    console.error("Pincode lookup failed:", error);
    return null;
  }
}