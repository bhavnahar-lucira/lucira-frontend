const SHOP = "luciraonline";
const rawStore = process.env.NEXT_PUBLIC_SHOPIFY_STORE || SHOP;
const SHOP_DOMAIN = rawStore.includes(".") ? rawStore : `${rawStore}.myshopify.com`;

export async function shopifyStorefrontFetch(query, variables = {}) {
  const token = process.env.NEXT_PUBLIC_STOREFRONT_TOKEN;
  
  if (!token) {
    console.error("NEXT_PUBLIC_STOREFRONT_TOKEN is not defined");
    return null;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[shopifyStorefrontFetch] Fetching from ${SHOP_DOMAIN}`);
    // console.log(`[shopifyStorefrontFetch] Variables:`, JSON.stringify(variables, null, 2));
  }

  try {
    const res = await fetch(`https://${SHOP_DOMAIN}/api/2024-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await res.json();

    if (process.env.NODE_ENV === "development") {
      console.log(`[shopifyStorefrontFetch] Response status: ${res.status}`);
      if (data.errors) {
        console.error("[shopifyStorefrontFetch] GraphQL Errors:", JSON.stringify(data.errors, null, 2));
      }
    }

    if (data.errors) {
      // console.error("Query:", query);
      // console.error("Variables:", JSON.stringify(variables, null, 2));
      return null;
    }
    return data.data;
  } catch (err) {
    console.error("Shopify Storefront Fetch Error:", err);
    return null;
  }
}

/**
 * Ensures an ID is in Shopify Global ID (GID) format.
 * @param {string|number} id The ID to convert
 * @param {string} type The Shopify resource type (e.g., 'ProductVariant', 'Product', 'Cart')
 * @returns {string} The formatted GID
 */
export function toShopifyGid(id, type = "ProductVariant") {
  if (!id) return id;
  const stringId = String(id);
  if (stringId.startsWith("gid://shopify/")) return stringId;
  return `gid://shopify/${type}/${stringId}`;
}

/* ================= CART QUERIES & MUTATIONS ================= */

export const CART_QUERY = `
  query getCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      totalQuantity
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                sku
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                image { url altText }
                product {
                  id
                  title
                  handle
                }
              }
            }
          }
        }
      }
      cost {
        totalAmount { amount currencyCode }
        subtotalAmount { amount currencyCode }
      }
    }
  }
`;

export const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CART_LINES_ADD_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CART_LINES_UPDATE_MUTATION = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        id
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CUSTOMER_QUERY = `
  query getCustomer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      firstName
      lastName
      email
      phone
      defaultAddress {
        id
        address1
        address2
        city
        province
        zip
        country
      }
      addresses(first: 10) {
        edges {
          node {
            id
            address1
            address2
            city
            province
            zip
            country
          }
        }
      }
    }
  }
`;

export const CUSTOMER_ORDERS_QUERY = `
  query getCustomerOrders($customerAccessToken: String!, $first: Int!) {
    customer(customerAccessToken: $customerAccessToken) {
      orders(first: $first, reverse: true) {
        edges {
          node {
            id
            orderNumber
            processedAt
            financialStatus
            fulfillmentStatus
            totalPrice { amount currencyCode }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  variant {
                    image { url altText }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const ADDRESS_CREATE_MUTATION = `
  mutation customerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
    customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
      customerAddress { id }
      customerUserErrors { field message }
    }
  }
`;

export const ADDRESS_UPDATE_MUTATION = `
  mutation customerAddressUpdate($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
    customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
      customerAddress { id }
      customerUserErrors { field message }
    }
  }
`;

export const ADDRESS_DELETE_MUTATION = `
  mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
    customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
      deletedCustomerAddressId
      customerUserErrors { field message }
    }
  }
`;

export const ADDRESS_DEFAULT_UPDATE_MUTATION = `
  mutation customerDefaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
    customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
      customer { id }
      customerUserErrors { field message }
    }
  }
`;


