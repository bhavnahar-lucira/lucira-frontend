"use client";

import { toast } from "react-toastify";
import { downloadReceiptPdf } from "@/lib/receiptPdf";
import { apiFetch } from "@/lib/api";

export async function fetchAndDownloadReceipt({
  customer,
  receiptEntityId,
  enrollmentEntityId,
}) {
  let finalReceiptEntityId = receiptEntityId;

  if (!finalReceiptEntityId && customer?.mobile && enrollmentEntityId) {
    const recordData = await apiFetch(
      `/api/schemes/payment-records?mobile=${encodeURIComponent(customer.mobile)}&enrollment_entity_id=${encodeURIComponent(enrollmentEntityId)}`
    );

    finalReceiptEntityId =
      recordData?.records?.[0]?.receipt_entity_id ||
      recordData?.records?.[0]?.receipt_create_result?.EntityId ||
      null;
  }

  if (!finalReceiptEntityId) {
    throw new Error("Receipt is not available yet.");
  }

  const retrieveData = await apiFetch("/api/schemes/receipt/retrieve", {
    method: "POST",
    body: JSON.stringify({
      EntityId: Number(finalReceiptEntityId),
    }),
  });

  if (!retrieveData || retrieveData.error) {
    throw new Error(
      retrieveData?.error?.Message ||
        retrieveData?.error ||
        "Failed to retrieve receipt"
    );
  }

  await downloadReceiptPdf(retrieveData);

  // Optional: Update record state in DB that PDF was downloaded
  try {
    await apiFetch("/api/schemes/payment-records", {
      method: "POST",
      body: JSON.stringify({
        customer,
        receipt_entity_id: finalReceiptEntityId,
        receipt_retrieve_result: retrieveData,
        receipt_pdf_downloaded_at: new Date().toISOString(),
        payment_status: "success",
      }),
    });
  } catch(e) {
    // Non-blocking error
    console.error("Failed to update payment record status after download", e);
  }

  return {
    receiptEntityId: finalReceiptEntityId,
    retrieveData,
  };
}

export async function handleReceiptDownload(options) {
  try {
    return await fetchAndDownloadReceipt(options);
  } catch (error) {
    console.error(error);
    toast.error(error.message || "Unable to download receipt");
    throw error;
  }
}
