import { NextResponse } from "next/server";
import { shopifyAdminFetch } from "@/lib/shopify";

export async function POST(request) {
  try {
    const { filename, mimeType } = await request.json();

    const query = `
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters { name value }
          }
          userErrors { field message }
        }
      }
    `;

    const variables = {
      input: [
        {
          filename,
          mimeType,
          resource: "FILE",
          httpMethod: "POST",
        },
      ],
    };

    const data = await shopifyAdminFetch(query, variables);
    const result = data.stagedUploadsCreate;

    if (result.userErrors.length > 0) {
      return NextResponse.json({ error: result.userErrors[0].message }, { status: 400 });
    }

    return NextResponse.json({ stagedTarget: result.stagedTargets[0] });
  } catch (error) {
    console.error("Staged Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
