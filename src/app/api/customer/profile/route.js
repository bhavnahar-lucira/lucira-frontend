import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { shopifyStorefrontFetch, shopifyAdminFetch } from "@/lib/shopify";

async function getCustomerAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("customerAccessToken")?.value || "";
}

async function getCustomerId(customerAccessToken) {
  const data = await shopifyStorefrontFetch(`
    query($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
      }
    }
  `, { customerAccessToken });
  return data?.customer?.id;
}

export async function GET() {
  try {
    const customerAccessToken = await getCustomerAccessToken();
    if (!customerAccessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await shopifyStorefrontFetch(`
      query($customerAccessToken: String!) {
        customer(customerAccessToken: $customerAccessToken) {
          id
          firstName
          lastName
          email
          phone
          defaultAddress {
            phone
          }
        }
      }
    `, { customerAccessToken });

    if (!data?.customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Fallback to default address phone if main phone is null
    const customerData = {
      ...data.customer,
      phone: data.customer.phone || data.customer.defaultAddress?.phone || null
    };

    return NextResponse.json({ customer: customerData }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const customerAccessToken = await getCustomerAccessToken();
    if (!customerAccessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = await getCustomerId(customerAccessToken);
    if (!customerId) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const body = await req.json();
    const { firstName, lastName, phone } = body;

    // Use Shopify Admin API to update customer
    const data = await shopifyAdminFetch(`
      mutation customerUpdate($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            firstName
            lastName
            phone
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      input: {
        id: customerId,
        firstName,
        lastName,
        phone
      }
    });

    if (data?.customerUpdate?.userErrors?.length > 0) {
      return NextResponse.json({ 
        error: data.customerUpdate.userErrors[0].message 
      }, { status: 400 });
    }

    return NextResponse.json({ customer: data.customerUpdate.customer });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
