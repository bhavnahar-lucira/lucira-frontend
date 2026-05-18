export function normalizeUserId(userId) {
  if (userId === null || userId === undefined) return null;

  const value = String(userId).trim();
  if (!value || value === "null" || value === "undefined") {
    return null;
  }

  return value;
}

export function buildCartLookup({ userId, sessionId }) {
  const normalizedUserId = normalizeUserId(userId);
  
  // 1. If we have an authenticated user, strictly only look for their cart
  if (normalizedUserId) {
    const conditions = [];
    const numericUserId = Number(normalizedUserId);
    if (Number.isSafeInteger(numericUserId)) {
      conditions.push({ userId: normalizedUserId });
      conditions.push({ userId: numericUserId });
    } else {
      conditions.push({ userId: normalizedUserId });
    }
    return conditions.length === 1 ? conditions[0] : { $or: conditions };
  }

  // 2. Otherwise, look for the guest session cart
  if (sessionId) {
    return { sessionId };
  }

  return {};
}
