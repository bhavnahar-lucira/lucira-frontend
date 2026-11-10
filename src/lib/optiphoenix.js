// Convert.com experiment log, sent to the backend the same way UTMs are (see
// utm.js / getStoredUtms): read here, carried in the body of login, register
// and checkout requests, written to the customer's custom.optiphoenix
// metafield server-side.
//
// Convert is loaded via GTM, which only runs in production builds, so on
// `npm run dev` this key never exists and nothing is sent.

export const CONV_EXP_LOG_KEY = "conv_zoho_exp_log";

/** The parsed experiment log, or null when absent / not an object. */
export const getConvExpLog = () => {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(CONV_EXP_LOG_KEY) || "null");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    return null;
  }
};
