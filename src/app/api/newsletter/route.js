import { shopifyAdminFetch } from "@/lib/shopify";
import { NextResponse } from "next/server";

const CUSTOMER_CREATE_MUTATION = `
  mutation customerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const variables = {
      input: {
        email,
        emailMarketingConsent: {
          marketingOptInLevel: "SINGLE_OPT_IN",
          marketingState: "SUBSCRIBED",
        },
        tags: ["newsletter"],
      },
    };

    const data = await shopifyAdminFetch(CUSTOMER_CREATE_MUTATION, variables);

    if (data.customerCreate.userErrors && data.customerCreate.userErrors.length > 0) {
      const errors = data.customerCreate.userErrors;
      
      // Check if email already exists
      const emailTaken = errors.find(err => err.message.toLowerCase().includes("email has already been taken"));
      
      if (emailTaken) {
        // If already exists, we can still consider it a "success" for the frontend
        // Or we could try updating the marketing consent, but for simplicity:
        return NextResponse.json({ 
          success: true, 
          message: "You are already subscribed to our newsletter!" 
        });
      }

      return NextResponse.json({ 
        error: errors[0].message,
        userErrors: errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Successfully subscribed to our newsletter!" 
    });
  } catch (error) {
    console.error("Newsletter API Error:", error);
    return NextResponse.json({ error: "Failed to subscribe. Please try again later." }, { status: 500 });
  }
}
