import { NextResponse } from "next/server";
import { shopifyAdminFetch } from "@/lib/shopify";

export async function POST(request) {
  try {
    const { resourceUrl, mimeType, filename } = await request.json();

    const query = `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            fileStatus
            ... on GenericFile { url }
            ... on MediaImage { image { url } }
            ... on Video { sources { url } }
          }
          userErrors { field message }
        }
      }
    `;

    const variables = {
      files: [
        {
          originalSource: resourceUrl,
          contentType: mimeType.startsWith("image") ? "IMAGE" : "FILE",
          alt: filename,
        },
      ],
    };

    const data = await shopifyAdminFetch(query, variables);
    const result = data.fileCreate;

    if (result.userErrors.length > 0) {
      return NextResponse.json({ success: false, error: result.userErrors[0].message }, { status: 400 });
    }

    // Wait for the file to be ready (simplified)
    const file = result.files[0];
    const url = file.url || file.image?.url || file.sources?.[0]?.url;

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Register Upload Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
