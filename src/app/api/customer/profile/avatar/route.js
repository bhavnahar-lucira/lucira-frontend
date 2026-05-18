import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { shopifyStorefrontFetch, shopifyAdminFetch, uploadFileToShopify, CUSTOMER_METAFIELD_UPDATE_MUTATION } from "@/lib/shopify";
import clientPromise from "@/lib/mongodb";

async function getCustomerAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("customerAccessToken")?.value || "";
}

async function getCustomerId(customerAccessToken) {
  try {
    const data = await shopifyStorefrontFetch(`
      query($customerAccessToken: String!) {
        customer(customerAccessToken: $customerAccessToken) {
          id
        }
      }
    `, { customerAccessToken });
    return data?.customer?.id;
  } catch (err) {
    console.error("Error in getCustomerId:", err.message);
    return null;
  }
}

export async function POST(req) {
  try {
    const customerAccessToken = await getCustomerAccessToken();
    if (!customerAccessToken) {
      return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
    }

    const customerId = await getCustomerId(customerAccessToken);
    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized: Could not fetch customer ID from Shopify" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to buffer for Shopify upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename for Shopify
    const cleanCustomerId = customerId.split("/").pop();
    const filename = `avatar-${cleanCustomerId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    
    // 1. Upload to Shopify Content/Files
    const shopifyUrl = await uploadFileToShopify(buffer, filename, file.type);

    // 2. Update Shopify Customer Metafield
    try {
      await shopifyAdminFetch(CUSTOMER_METAFIELD_UPDATE_MUTATION, {
        input: {
          id: customerId,
          metafields: [
            {
              namespace: "custom",
              key: "avatar_url",
              value: shopifyUrl,
              type: "single_line_text_field"
            }
          ]
        }
      });
    } catch (metaError) {
      console.warn("Failed to update Shopify customer metafield:", metaError.message);
      // Continue even if metafield update fails, as MongoDB and file upload succeeded
    }

    // 3. Save Shopify URL to MongoDB
    const client = await clientPromise;
    const db = client.db("shopify-app");
    const collection = db.collection("customer_profiles");

    await collection.updateOne(
      { customerId: customerId },
      { 
        $set: { 
          avatarUrl: shopifyUrl,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ url: shopifyUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const customerAccessToken = await getCustomerAccessToken();
    if (!customerAccessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = await getCustomerId(customerAccessToken);
    if (!customerId) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // 1. Try to get from Shopify Metafields first (Admin API)
    try {
      const shopifyData = await shopifyAdminFetch(`
        query($id: ID!) {
          customer(id: $id) {
            metafield(namespace: "custom", key: "avatar_url") {
              value
            }
          }
        }
      `, { id: customerId });

      if (shopifyData?.customer?.metafield?.value) {
        return NextResponse.json({ avatar: shopifyData.customer.metafield.value });
      }
    } catch (shopifyError) {
      console.warn("Failed to fetch avatar from Shopify metafields:", shopifyError.message);
    }

    // 2. Fallback to MongoDB
    const client = await clientPromise;
    const db = client.db("shopify-app");
    const collection = db.collection("customer_profiles");

    const profile = await collection.findOne({ customerId: customerId });

    return NextResponse.json({ avatar: profile?.avatarUrl || null });
  } catch (error) {
    console.error("Avatar get error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
