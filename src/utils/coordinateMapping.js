// Shared coordinate mapping for specific store areas
export const PINCODE_COORDINATES = {
  "400066": { lat: 19.2290, lng: 72.8602 }, // Borivali
  "400071": { lat: 19.0622, lng: 72.8973 }, // Chembur
  "400062": { lat: 19.1634, lng: 72.8412 }, // Goregaon
  "201301": { lat: 28.5708, lng: 77.3272 }, // Noida Sector 18
  "411005": { lat: 18.5312, lng: 73.8445 }, // Balgandharv Chowk, Pune
  "110001": { lat: 28.6139, lng: 77.2090 }, // Central Delhi
  "400001": { lat: 18.9220, lng: 72.8347 }, // Mumbai Fort
};

/**
 * Refines a pincode collection with accurate built-in coordinates
 * @param {import('mongodb').Collection} pincodesCollection 
 */
export async function refinePincodeData(pincodesCollection) {
  let updated = 0;
  for (const [pincode, coords] of Object.entries(PINCODE_COORDINATES)) {
    const result = await pincodesCollection.updateOne(
      { pincode: pincode },
      { 
        $set: { 
          latitude: coords.lat, 
          longitude: coords.lng,
          updatedAt: new Date(),
          source: "built_in_refinement"
        } 
      },
      { upsert: false } // Only update if it exists
    );
    if (result.modifiedCount > 0) updated++;
  }
  return updated;
}
