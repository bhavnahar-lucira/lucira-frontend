import { fetchWithRetry } from "@/utils/helpers";

const SHOP = "luciraonline";
const rawStore = process.env.SHOPIFY_STORE || process.env.SHOPIFYSTORE || SHOP;
const SHOP_DOMAIN = rawStore.includes(".") ? rawStore : `${rawStore}.myshopify.com`;

export async function shopifyStorefrontFetch(query, variables = {}, options = {}) {
  let token = process.env.STOREFRONT_TOKEN;

  // Use the RW token specifically for customer and blog queries if explicitly requested
  // or if it matches the legacy detection (to maintain existing customer functionality)
  const isCustomer = /(?:customer|address)\s*\(/i.test(query);
  if ((options.useRwToken || isCustomer) && process.env.SHOPIFY_RW_STOREFRONT_TOKEN) {
    token = process.env.SHOPIFY_RW_STOREFRONT_TOKEN;
  }

  if (!token) {
    throw new Error("STOREFRONT_TOKEN not configured");
  }

  try {
    const res = await fetchWithRetry(
      `https://${SHOP_DOMAIN}/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token,
          ...options.headers
        },
        body: JSON.stringify({ query, variables }),
        // Caller controls caching strategy:
        //   ISR pages:   { cache: 'no-store' }    → fresh on each ISR render, page-level revalidate governs timing
        //   Build-time:  { cache: 'force-cache' } → reuse build cache, no background re-renders
        //   Default:     { cache: 'no-store' }    → safe default, avoids stale data
        cache: options.cache ?? 'no-store',
        ...(options.next ? { next: options.next } : {})
      }
    );

    const data = await res.json();

    if (data.errors) {
      const isAccessDenied = data.errors.some(err => err.extensions?.code === "ACCESS_DENIED");
      if (isAccessDenied) {
        console.warn("GraphQL Access Denied (Storefront API):", data.errors[0]?.message);
        // Do not throw, return an empty object so it fails gracefully to fallbacks
        return {};
      } else {
        console.error("GraphQL Errors:", JSON.stringify(data.errors, null, 2));
      }
      throw new Error(data.errors[0]?.message || "GraphQL error");
    }

    return data.data;
  } catch (err) {
    if (err.message && err.message.includes("Access denied")) {
      console.warn(`Storefront Fetch Warning (${SHOP_DOMAIN}):`, err.message);
      return {};
    } else {
      console.error(`Storefront Fetch Error (${SHOP_DOMAIN}):`, err.message);
    }
    throw err;
  }
}

export async function shopifyAdminFetch(query, variables = {}, options = {}) {
  const adminToken = process.env.ADMIN_TOKEN || process.env.SHOPIFY_ADMIN_TOKEN;
  if (!adminToken) {
    throw new Error("ADMIN_TOKEN or SHOPIFY_ADMIN_TOKEN not configured");
  }

  const res = await fetchWithRetry(
    `https://${SHOP_DOMAIN}/admin/api/${options.apiVersion || "2024-10"}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminToken,
      },
      body: JSON.stringify({ query, variables }),
      next: {
        revalidate: 3600, // ✅ 1 hour default cache
        ...options.next
      },
      ...options
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Admin Fetch Error (${res.status}):`, errorText);
    throw new Error(`Shopify Admin API error ${res.status}: ${errorText.substring(0, 100)}`);
  }

  const data = await res.json();

  if (data.errors) {
    console.error("GraphQL Errors:", data.errors);
    throw new Error(data.errors[0]?.message || "GraphQL error");
  }

  return data.data;
}

export async function shopifyAdminRestFetch(endpoint, params = {}, options = {}) {
  const adminToken = process.env.ADMIN_TOKEN || process.env.SHOPIFY_ADMIN_TOKEN;
  if (!adminToken) {
    throw new Error("ADMIN_TOKEN or SHOPIFY_ADMIN_TOKEN not configured");
  }

  const method = options.method || "GET";
  const apiVersion = options.apiVersion || "2024-10";
  const url = new URL(`https://${SHOP_DOMAIN}/admin/api/${apiVersion}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });


  const res = await fetchWithRetry(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Admin REST Errors:", data);
    throw new Error(data.errors?.[0]?.message || data.error || `Admin REST error ${res.status}`);
  }

  return {
    data,
    linkHeader: res.headers.get("link"),
  };
}

/* ================= MUTATIONS ================= */

export const STAGED_UPLOADS_CREATE_MUTATION = `
  mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const FILE_CREATE_MUTATION = `
  mutation fileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        fileStatus
        ... on GenericFile {
          url
        }
        ... on MediaImage {
          image {
            url
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const FILE_QUERY = `
  query getFile($id: ID!) {
    node(id: $id) {
      ... on MediaImage {
        fileStatus
        image {
          url
        }
      }
      ... on GenericFile {
        fileStatus
        url
      }
    }
  }
`;

export const CUSTOMER_METAFIELD_UPDATE_MUTATION = `
  mutation customerUpdate($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        metafield(namespace: "custom", key: "avatar_url") {
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Server-side utility to upload a file to Shopify Content/Files
 * @param {Buffer} buffer The file content
 * @param {string} filename The filename
 * @param {string} mimeType The mime type
 * @returns {Promise<string>} The uploaded file URL
 */
export async function uploadFileToShopify(buffer, filename, mimeType) {
  try {
    // 1. Create staged upload
    const stagedData = await shopifyAdminFetch(STAGED_UPLOADS_CREATE_MUTATION, {
      input: [
        {
          filename,
          mimeType,
          resource: mimeType.startsWith("image/") ? "IMAGE" : "FILE",
          httpMethod: "POST",
        },
      ],
    });

    const stagedTarget = stagedData.stagedUploadsCreate.stagedTargets[0];
    if (stagedData.stagedUploadsCreate.userErrors?.length > 0) {
      throw new Error(stagedData.stagedUploadsCreate.userErrors[0].message);
    }

    // 2. Upload to Shopify's URL (Google Cloud Storage typically)
    const formData = new FormData();
    stagedTarget.parameters.forEach((param) => {
      formData.append(param.name, param.value);
    });

    // Convert Buffer to Blob for Fetch API
    const blob = new Blob([buffer], { type: mimeType });
    formData.append("file", blob, filename);

    const uploadRes = await fetch(stagedTarget.url, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error("Shopify Storage Upload Error:", errorText);
      throw new Error("Failed to upload file to Shopify storage");
    }

    // 3. Register file in Shopify
    const registerData = await shopifyAdminFetch(FILE_CREATE_MUTATION, {
      files: [
        {
          alt: filename.startsWith("headless_") ? filename : `headless_${filename}`,
          contentType: mimeType.startsWith("image/") ? "IMAGE" : "FILE",
          originalSource: stagedTarget.resourceUrl,
        },
      ],
    });

    if (registerData.fileCreate.userErrors?.length > 0) {
      throw new Error(registerData.fileCreate.userErrors[0].message);
    }

    const fileId = registerData.fileCreate.files[0].id;

    // 4. Poll for file readiness
    return await pollFileStatus(fileId);
  } catch (error) {
    console.error("uploadFileToShopify error:", error);
    throw error;
  }
}

async function pollFileStatus(fileId) {
  let attempts = 0;
  const maxAttempts = 15;
  const delay = 1000;

  while (attempts < maxAttempts) {
    const data = await shopifyAdminFetch(FILE_QUERY, { id: fileId });
    const file = data.node;

    if (file && (file.fileStatus === "READY" || (file.image && file.image.url) || file.url)) {
      return file.image?.url || file.url;
    }

    if (file && file.fileStatus === "FAILED") {
      throw new Error("File upload processing failed in Shopify");
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    attempts++;
  }

  throw new Error("Timeout waiting for file to be ready in Shopify");
}

/* ================= ISR HELPERS ================= */

/**
 * Fetches all product handles for generateStaticParams
 */
export async function getAllProductHandles() {
  const query = `
    query getAllProducts($cursor: String) {
      products(first: 250, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            handle
          }
        }
      }
    }
  `;

  let handles = [];
  let cursor = null;
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      // force-cache: reuse build-time cache. These functions only run during generateStaticParams
      // (build time). No background revalidation needed — timers here cause Vercel function invocations.
      const data = await shopifyStorefrontFetch(query, { cursor }, { cache: 'force-cache' });
      if (!data?.products) break;

      const newHandles = data.products.edges.map(edge => edge.node.handle);
      handles = [...handles, ...newHandles];
      hasNextPage = data.products.pageInfo.hasNextPage;
      cursor = data.products.pageInfo.endCursor;
    }
    return handles;
  } catch (error) {
    console.error("Error fetching all product handles:", error);
    return [];
  }
}

/**
 * Fetches all collection handles for generateStaticParams
 */
export async function getAllCollectionHandles() {
  const query = `
    query getAllCollections($cursor: String) {
      collections(first: 250, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            handle
          }
        }
      }
    }
  `;

  let handles = [];
  let cursor = null;
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      // force-cache: reuse build-time cache. These functions only run during generateStaticParams.
      const data = await shopifyStorefrontFetch(query, { cursor }, { cache: 'force-cache' });
      if (!data?.collections) break;

      const newHandles = data.collections.edges.map(edge => edge.node.handle);
      handles = [...handles, ...newHandles];
      hasNextPage = data.collections.pageInfo.hasNextPage;
      cursor = data.collections.pageInfo.endCursor;
    }
    return handles;
  } catch (error) {
    console.error("Error fetching all collection handles:", error);
    return [];
  }
}
