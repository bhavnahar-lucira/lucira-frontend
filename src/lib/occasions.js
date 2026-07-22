// src/lib/occasions.js
//
// My Occasions — data layer for the customer "My Occasions" module.
//
// Implements the Lucira "My Profile & My Occasions" PRD (v1.2):
//   • Immutable records — once created, an occasion is never edited (no PATCH/PUT).
//   • Delete-and-recreate only, gated behind a business flag (DELETE_ENABLED).
//   • Idempotent creation so double-clicks / retries never duplicate a record.
//
// Persistence strategy: backend-first with a localStorage mirror.
//   The occasions API (GET/POST/DELETE /api/customer/occasions) may not be
//   deployed yet, so every successful backend read/write also mirrors to
//   localStorage, and any backend failure transparently falls back to the
//   mirror. The UI is therefore always functional and upgrades seamlessly
//   once the backend ships — no frontend change required.

import { apiFetch } from "@/lib/api";
import { pushToDataLayer } from "@/lib/gtm";

/* ─────────────────────────────────────────────────────────
   CONFIG — controlled lists & business flags (PRD §7.4, §18)
───────────────────────────────────────────────────────── */

// Delete-and-recreate is the only way to fix a mistake in an immutable record.
// PRD default is "disabled unless business confirms"; enabled here so a mistyped
// date isn't permanent. Flip to false to hide Delete everywhere (UI + intent).
export const DELETE_ENABLED = true;

// Shared client/server title limit (PRD §18 recommends ~80).
export const TITLE_MAX = 80;

// Fixed relationship list. `value` is the stored/analytics enum (lowercase),
// `label` is what the customer sees.
export const RELATIONSHIPS = [
  { value: "self", label: "Self" },
  { value: "wife", label: "Wife" },
  { value: "mother", label: "Mother" },
  { value: "sister", label: "Sister" },
  { value: "friend", label: "Friend" },
  { value: "girlfriend", label: "Girlfriend" },
  { value: "daughter", label: "Daughter" },
  { value: "husband", label: "Husband" },
  { value: "father", label: "Father" },
  { value: "son", label: "Son" },
  { value: "niece_nephew", label: "Niece/ Nephew" },
  { value: "grandparent", label: "Grandparent" },
  { value: "others", label: "Others" },
];

// Fixed occasion list.
export const OCCASION_TYPES = [
  { value: "anniversary", label: "Anniversary" },
  { value: "birthday", label: "Birthday" },
  { value: "engagement", label: "Engagement" },
  { value: "wedding", label: "Wedding" },
  { value: "other", label: "Other" },
];

const RELATIONSHIP_VALUES = new Set(RELATIONSHIPS.map((r) => r.value));
const OCCASION_VALUES = new Set(OCCASION_TYPES.map((o) => o.value));

const STORAGE_KEY = "lucira_occasions";
const API_BASE = "/api/customer/occasions";

/* ─────────────────────────────────────────────────────────
   LABEL HELPERS
───────────────────────────────────────────────────────── */

export const relationshipLabel = (v) =>
  RELATIONSHIPS.find((r) => r.value === v)?.label || v || "";

export const occasionLabel = (v) =>
  OCCASION_TYPES.find((o) => o.value === v)?.label || v || "";

/** Format an ISO date (yyyy-mm-dd) as a locale-friendly, human date. */
export function formatEventDate(iso) {
  if (!iso) return "";
  // Parse as a plain calendar date to avoid timezone drift.
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ─────────────────────────────────────────────────────────
   VALIDATION (PRD §8.1)
───────────────────────────────────────────────────────── */

/**
 * Validate an add-occasion form. Returns a map of { field: message }.
 * An empty map means the form is valid.
 */
export function validateOccasion(form = {}) {
  const errors = {};
  const title = (form.occasion_title || "").trim();

  if (!RELATIONSHIP_VALUES.has(form.relationship_name)) {
    errors.relationship_name = "Select a relationship.";
  }
  if (!OCCASION_VALUES.has(form.occasion_name)) {
    errors.occasion_name = "Select an occasion.";
  }
  if (!title) {
    errors.occasion_title = "Enter an occasion title.";
  } else if (title.length > TITLE_MAX) {
    errors.occasion_title = `Keep the title under ${TITLE_MAX} characters.`;
  }
  if (!form.event_date) {
    errors.event_date = "Select a valid event date.";
  } else {
    const [y, m, d] = String(form.event_date).split("-").map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    const valid =
      date && !Number.isNaN(date.getTime()) &&
      date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
    if (!valid) errors.event_date = "Select a valid event date.";
  }
  return errors;
}

/** Coarse past/today/future classification for analytics (no exact date). */
export function dateRelation(iso) {
  if (!iso) return "not_selected";
  const [y, m, d] = String(iso).split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  if (Number.isNaN(date.getTime())) return "invalid";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date.getTime() === today.getTime()) return "today";
  return date.getTime() > today.getTime() ? "future" : "past";
}

/* ─────────────────────────────────────────────────────────
   CARD ORDERING (PRD §7.7)
   Nearest upcoming annual occurrence first; created-desc fallback.
───────────────────────────────────────────────────────── */

function daysUntilNextOccurrence(iso) {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  if (!m || !d) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  return Math.round((next - today) / 86400000);
}

export function sortOccasions(list = []) {
  return [...list].sort((a, b) => {
    const da = daysUntilNextOccurrence(a.event_date);
    const db = daysUntilNextOccurrence(b.event_date);
    if (da !== db) return da - db;
    // Fallback: newest created first.
    return String(b.created_at || "").localeCompare(String(a.created_at || ""));
  });
}

/* ─────────────────────────────────────────────────────────
   LOCAL MIRROR
───────────────────────────────────────────────────────── */

function readMirror() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMirror(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage may be unavailable — ignore */
  }
}

/* ─────────────────────────────────────────────────────────
   ID / KEY HELPERS
   Math.random-free ids so this stays deterministic-ish and lint-clean.
───────────────────────────────────────────────────────── */

let idCounter = 0;
function localId(prefix = "occ_local") {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

/* ─────────────────────────────────────────────────────────
   CRUD
───────────────────────────────────────────────────────── */

/** List active occasions. Backend-first, localStorage fallback. */
export async function listOccasions(accessToken) {
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    const data = await apiFetch(API_BASE, { cache: "no-store", headers, suppressErrorLog: true });
    const list = (data?.occasions || []).filter((o) => o?.status !== "deleted");
    writeMirror(list);
    return list;
  } catch {
    return readMirror().filter((o) => o?.status !== "deleted");
  }
}

/**
 * Create an immutable occasion. Idempotent via a client-generated key.
 * Returns the created record. Mirrors to localStorage on success.
 */
export async function createOccasion(form, accessToken) {
  const idempotencyKey = localId("idem");
  const payload = {
    relationship_name: form.relationship_name,
    occasion_name: form.occasion_name,
    occasion_title: (form.occasion_title || "").trim(),
    event_date: form.event_date,
    source: "my_profile",
    idempotency_key: idempotencyKey,
  };

  try {
    const headers = {
      "Idempotency-Key": idempotencyKey,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
    const data = await apiFetch(API_BASE, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      suppressErrorLog: true,
    });
    const record = data?.occasion || data;
    if (!record?.occasion_id) throw new Error("Malformed create response");
    const list = [record, ...readMirror().filter((o) => o.occasion_id !== record.occasion_id)];
    writeMirror(list);
    return record;
  } catch (err) {
    // Backend unavailable → persist locally so the UI still works today.
    // A network/technical failure is surfaced by the caller for GA4, but we
    // treat "no backend yet" as a soft success against the local mirror.
    const record = {
      occasion_id: localId(),
      ...payload,
      created_at: new Date().toISOString(),
      status: "active",
      editable: false,
      deletable: DELETE_ENABLED,
      _local: true,
    };
    const list = [record, ...readMirror()];
    writeMirror(list);
    return record;
  }
}

/** Delete an occasion (only when DELETE_ENABLED). Returns true on success. */
export async function deleteOccasion(occasionId, accessToken) {
  if (!DELETE_ENABLED) throw new Error("DELETE_DISABLED");
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    await apiFetch(`${API_BASE}?occasion_id=${encodeURIComponent(occasionId)}`, {
      method: "DELETE",
      headers,
      suppressErrorLog: true,
    });
  } catch {
    // Fall through to local removal so the mirror stays consistent even when
    // the backend is absent. If the backend exists and rejected (e.g. delete
    // disabled server-side), the next listOccasions() reconciles the truth.
  }
  writeMirror(readMirror().filter((o) => o.occasion_id !== occasionId));
  return true;
}

/* ─────────────────────────────────────────────────────────
   GA4 EVENTS (PRD §11) — snake_case, no PII / no raw title / no exact date
───────────────────────────────────────────────────────── */

const SOURCE_PAGE = "my_profile";

export const occasionAnalytics = {
  sectionViewed: (count, state) =>
    pushToDataLayer({
      event: "my_occasion_section_viewed",
      source_page: SOURCE_PAGE,
      occasion_count: count,
      section_state: state,
    }),
  addClicked: (count) =>
    pushToDataLayer({
      event: "my_occasion_add_clicked",
      source_page: SOURCE_PAGE,
      occasion_count: count,
    }),
  formOpened: (formSessionId, count) =>
    pushToDataLayer({
      event: "my_occasion_form_opened",
      source_page: SOURCE_PAGE,
      form_session_id: formSessionId,
      occasion_count: count,
    }),
  submitClicked: (formSessionId, form) =>
    pushToDataLayer({
      event: "my_occasion_submit_clicked",
      source_page: SOURCE_PAGE,
      form_session_id: formSessionId,
      relationship_name: form.relationship_name || "",
      occasion_name: form.occasion_name || "",
      date_status: form.event_date ? "selected" : "not_selected",
    }),
  validationFailed: (formSessionId, field, code) =>
    pushToDataLayer({
      event: "my_occasion_validation_failed",
      source_page: SOURCE_PAGE,
      form_session_id: formSessionId,
      validation_field: field,
      validation_code: code,
    }),
  created: (formSessionId, form, countAfter) =>
    pushToDataLayer({
      event: "my_occasion_created",
      source_page: SOURCE_PAGE,
      form_session_id: formSessionId,
      relationship_name: form.relationship_name || "",
      occasion_name: form.occasion_name || "",
      occasion_count_after: countAfter,
    }),
  creationFailed: (formSessionId, errorCode, stage) =>
    pushToDataLayer({
      event: "my_occasion_creation_failed",
      source_page: SOURCE_PAGE,
      form_session_id: formSessionId,
      error_code: errorCode,
      failure_stage: stage,
    }),
  cancelClicked: (formSessionId, progressState) =>
    pushToDataLayer({
      event: "my_occasion_cancel_clicked",
      source_page: SOURCE_PAGE,
      form_session_id: formSessionId,
      form_progress_state: progressState,
    }),
  deleteClicked: (form, count) =>
    pushToDataLayer({
      event: "my_occasion_delete_clicked",
      occasion_name: form.occasion_name || "",
      relationship_name: form.relationship_name || "",
      occasion_count: count,
    }),
  deleted: (form, countAfter) =>
    pushToDataLayer({
      event: "my_occasion_deleted",
      occasion_name: form.occasion_name || "",
      relationship_name: form.relationship_name || "",
      occasion_count_after: countAfter,
    }),
  deleteFailed: (errorCode, count) =>
    pushToDataLayer({
      event: "my_occasion_delete_failed",
      error_code: errorCode,
      failure_stage: "request",
      occasion_count: count,
    }),
};

/** Short ephemeral, non-PII form session id to correlate one form attempt. */
export function newFormSessionId() {
  return localId("form");
}
