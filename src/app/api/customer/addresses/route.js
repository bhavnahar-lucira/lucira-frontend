import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { shopifyStorefrontFetch } from "@/lib/shopify";
import clientPromise from "@/lib/mongodb";

const ADDRESS_FIELDS = `
  id
  address1
  address2
  city
  company
  country
  firstName
  lastName
  phone
  province
  zip
  formatted(withName: true, withCompany: true)
`;

function getErrorMessage(errors = []) {
  return errors[0]?.message || "Unable to process address";
}

function normalizeAddress(address) {
  if (!address) return null;

  return {
    id: address.id,
    firstName: address.firstName || "",
    lastName: address.lastName || "",
    company: address.company || "",
    address1: address.address1 || "",
    address2: address.address2 || "",
    city: address.city || "",
    province: address.province || "",
    zip: address.zip || "",
    country: address.country || "",
    phone: address.phone || "",
    formatted: Array.isArray(address.formatted) ? address.formatted.filter(Boolean) : [],
  };
}

async function getCustomerAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("customerAccessToken")?.value || "";
}

async function fetchCustomerAddresses(customerAccessToken) {
  const data = await shopifyStorefrontFetch(
    `
      query CustomerAddresses($customerAccessToken: String!) {
        customer(customerAccessToken: $customerAccessToken) {
          id
          firstName
          lastName
          email
          phone
          defaultAddress {
            ${ADDRESS_FIELDS}
          }
          addresses(first: 50) {
            edges {
              node {
                ${ADDRESS_FIELDS}
              }
            }
          }
        }
      }
    `,
    { customerAccessToken }
  );

  const customer = data.customer;
  if (!customer) throw new Error("Customer not found");

  const addressIds = (customer.addresses?.edges || [])
    .map(({ node }) => node?.id)
    .filter(Boolean);
  let metaMap = new Map();

  try {
    const client = await clientPromise;
    const db = client.db("shopify-app");
    const addressMetaCollection = db.collection("customer_address_meta");
    const metaRows = addressIds.length
      ? await addressMetaCollection
          .find({ addressId: { $in: addressIds } })
          .project({ addressId: 1, gstin: 1 })
          .toArray()
      : [];

    metaMap = new Map(metaRows.map((row) => [row.addressId, row.gstin || ""]));
  } catch (error) {
    console.error("GSTIN metadata read error:", error);
  }

  const defaultAddressId = customer.defaultAddress?.id || null;
  const addresses = (customer.addresses?.edges || []).map(({ node }) => {
    const normalized = normalizeAddress(node);
    return {
      ...normalized,
      gstin: metaMap.get(normalized?.id) || "",
      isDefault: normalized?.id === defaultAddressId,
    };
  });

  return {
    customer: {
      id: customer.id,
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      email: customer.email || "",
      phone: customer.phone || "",
    },
    defaultAddressId,
    addresses,
  };
}

function buildAddressInput(payload = {}) {
  return {
    firstName: payload.firstName?.trim() || "",
    lastName: payload.lastName?.trim() || "",
    company: payload.company?.trim() || "",
    address1: payload.address1?.trim() || "",
    address2: payload.address2?.trim() || "",
    city: payload.city?.trim() || "",
    province: payload.province?.trim() || "",
    zip: payload.zip?.trim() || "",
    country: payload.country?.trim() || "",
    phone: payload.phone?.trim() || "",
  };
}

function normalizeGstin(value = "") {
  return value.trim().toUpperCase();
}

function validateOptionalGstin(value = "") {
  const gstin = normalizeGstin(value);
  if (!gstin) return "";
  if (gstin.length !== 15) {
    return "GSTIN must be 15 characters";
  }
  return "";
}

async function upsertAddressMeta(addressId, gstin = "") {
  const normalizedGstin = normalizeGstin(gstin);

  try {
    const client = await clientPromise;
    const db = client.db("shopify-app");
    const addressMetaCollection = db.collection("customer_address_meta");

    if (!normalizedGstin) {
      await addressMetaCollection.deleteOne({ addressId });
      return;
    }

    await addressMetaCollection.updateOne(
      { addressId },
      {
        $set: {
          addressId,
          gstin: normalizedGstin,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("GSTIN metadata write error:", error);
  }
}

async function deleteAddressMeta(addressId) {
  try {
    const client = await clientPromise;
    const db = client.db("shopify-app");
    const addressMetaCollection = db.collection("customer_address_meta");
    await addressMetaCollection.deleteOne({ addressId });
  } catch (error) {
    console.error("GSTIN metadata delete error:", error);
  }
}

function attachGstinToResponse(result, addressId, gstin = "") {
  const normalizedGstin = normalizeGstin(gstin);
  if (!result?.addresses?.length || !addressId) return result;

  return {
    ...result,
    addresses: result.addresses.map((address) =>
      address.id === addressId
        ? { ...address, gstin: normalizedGstin }
        : address
    ),
  };
}

async function setDefaultAddress(customerAccessToken, addressId) {
  const data = await shopifyStorefrontFetch(
    `
      mutation CustomerDefaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
        customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
          customer {
            id
          }
          customerUserErrors {
            field
            message
          }
        }
      }
    `,
    { customerAccessToken, addressId }
  );

  const errors = data.customerDefaultAddressUpdate?.customerUserErrors || [];
  if (errors.length) throw new Error(getErrorMessage(errors));
}

export async function GET() {
  try {
    const customerAccessToken = await getCustomerAccessToken();
    if (!customerAccessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(await fetchCustomerAddresses(customerAccessToken));
  } catch (error) {
    console.error("Customer addresses fetch error:", error);
    return NextResponse.json({ customer: null, defaultAddressId: null, addresses: [] });
  }
}

export async function POST(req) {
  try {
    const customerAccessToken = await getCustomerAccessToken();
    if (!customerAccessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const gstinError = validateOptionalGstin(body.address?.gstin || "");
    if (gstinError) {
      return NextResponse.json({ error: gstinError }, { status: 400 });
    }

    const data = await shopifyStorefrontFetch(
      `
        mutation CustomerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
          customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
            customerAddress {
              ${ADDRESS_FIELDS}
            }
            customerUserErrors {
              field
              message
            }
          }
        }
      `,
      { customerAccessToken, address: buildAddressInput(body.address) }
    );

    const payload = data.customerAddressCreate;
    const errors = payload?.customerUserErrors || [];
    if (errors.length) {
      return NextResponse.json({ error: getErrorMessage(errors) }, { status: 400 });
    }

    if (body.makeDefault && payload?.customerAddress?.id) {
      await setDefaultAddress(customerAccessToken, payload.customerAddress.id);
    }

    if (payload?.customerAddress?.id) {
      await upsertAddressMeta(payload.customerAddress.id, body.address?.gstin || "");
    }

    const result = await fetchCustomerAddresses(customerAccessToken);
    return NextResponse.json(
      attachGstinToResponse(result, payload?.customerAddress?.id, body.address?.gstin || "")
    );
  } catch (error) {
    console.error("Customer address create error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add address" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const customerAccessToken = await getCustomerAccessToken();
    if (!customerAccessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.addressId) {
      return NextResponse.json({ error: "Address id required" }, { status: 400 });
    }
    const gstinError = validateOptionalGstin(body.address?.gstin || "");
    if (body.mode !== "default" && gstinError) {
      return NextResponse.json({ error: gstinError }, { status: 400 });
    }

    if (body.mode === "default") {
      await setDefaultAddress(customerAccessToken, body.addressId);
      return NextResponse.json(await fetchCustomerAddresses(customerAccessToken));
    }

    const data = await shopifyStorefrontFetch(
      `
        mutation CustomerAddressUpdate($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
          customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
            customerAddress {
              ${ADDRESS_FIELDS}
            }
            customerUserErrors {
              field
              message
            }
          }
        }
      `,
      {
        customerAccessToken,
        id: body.addressId,
        address: buildAddressInput(body.address),
      }
    );

    const payload = data.customerAddressUpdate;
    const errors = payload?.customerUserErrors || [];
    if (errors.length) {
      return NextResponse.json({ error: getErrorMessage(errors) }, { status: 400 });
    }

    if (body.makeDefault && payload?.customerAddress?.id) {
      await setDefaultAddress(customerAccessToken, payload.customerAddress.id);
    }

    await upsertAddressMeta(body.addressId, body.address?.gstin || "");

    return NextResponse.json(await fetchCustomerAddresses(customerAccessToken));
  } catch (error) {
    console.error("Customer address update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const customerAccessToken = await getCustomerAccessToken();
    if (!customerAccessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get("addressId");
    if (!addressId) {
      return NextResponse.json({ error: "Address id required" }, { status: 400 });
    }

    const data = await shopifyStorefrontFetch(
      `
        mutation CustomerAddressDelete($customerAccessToken: String!, $id: ID!) {
          customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
            deletedCustomerAddressId
            customerUserErrors {
              field
              message
            }
          }
        }
      `,
      { customerAccessToken, id: addressId }
    );

    const payload = data.customerAddressDelete;
    const errors = payload?.customerUserErrors || [];
    if (errors.length) {
      return NextResponse.json({ error: getErrorMessage(errors) }, { status: 400 });
    }

    await deleteAddressMeta(addressId);

    return NextResponse.json(await fetchCustomerAddresses(customerAccessToken));
  } catch (error) {
    console.error("Customer address delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove address" },
      { status: 500 }
    );
  }
}
