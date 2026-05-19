import { NextResponse } from "next/server";
import { shopifyStorefrontFetch } from "@/lib/shopify";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get("handle");
    const productIdParam = searchParams.get("id");

    if (!handle && !productIdParam) {
      return NextResponse.json({ products: [] });
    }

    // 1. Fetch manual 'matching_product' metafield (value or references)
    const queryField = productIdParam ? 'id: $id' : 'handle: $handle';
    const queryVars = productIdParam ? '$id: ID' : '$handle: String';

    const GET_PRODUCT_META = `
      query getProductMetadata(${queryVars}) {
        product(${queryField}) {
          id
          matching_products: metafield(namespace: "custom", key: "matching_product") {
            value
            references(first: 20) {
              edges {
                node {
                  ... on Product {
                    id
                    title
                    handle
                    featuredImage { url }
                    variants(first: 1) {
                      edges {
                        node {
                          price { amount }
                          compareAtPrice { amount }
                        }
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

    const metaData = await shopifyStorefrontFetch(GET_PRODUCT_META, {
      handle: handle || null,
      id: productIdParam || null
    }, { next: { revalidate: 3600 } });

    const product = metaData?.product;
    if (!product) {
      return NextResponse.json({ products: [] });
    }

    let similarNodes = (product.matching_products?.references?.edges || []).map(edge => edge.node);
    
    // 2. If 'references' is empty but 'value' exists, it's likely a JSON array of GIDs
    if (similarNodes.length === 0 && product.matching_products?.value) {
      try {
        const gids = JSON.parse(product.matching_products.value);
        if (Array.isArray(gids) && gids.length > 0) {
          const NODES_QUERY = `
            query getNodes($ids: [ID!]!) {
              nodes(ids: $ids) {
                ... on Product {
                  id
                  title
                  handle
                  featuredImage { url }
                  variants(first: 1) {
                    edges {
                      node {
                        price { amount }
                        compareAtPrice { amount }
                      }
                    }
                  }
                }
              }
            }
          `;
          const nodesData = await shopifyStorefrontFetch(NODES_QUERY, { ids: gids }, { next: { revalidate: 3600 } });
          similarNodes = (nodesData?.nodes || []).filter(Boolean);
        }
      } catch (e) {
        console.warn("Failed to parse matching_products JSON:", e.message);
      }
    }

    // 3. Fallback to Shopify Recommendations if still empty
    if (similarNodes.length === 0) {
      const RECOMMENDATIONS_QUERY = `
        query getRecommendations($productId: ID!) {
          productRecommendations(productId: $productId) {
            id
            title
            handle
            featuredImage { url }
            variants(first: 1) {
              edges {
                node {
                  price { amount }
                  compareAtPrice { amount }
                }
              }
            }
          }
        }
      `;

      const recData = await shopifyStorefrontFetch(RECOMMENDATIONS_QUERY, {
        productId: product.id
      }, { next: { revalidate: 3600 } });

      similarNodes = recData?.productRecommendations || [];
    }

    // 4. Map nodes. Review stats hydrate from the browser via /api/reviews.
    const products = similarNodes.map((p) => ({
        id: p.id.split("/").pop(),
        shopifyId: p.id,
        title: p.title,
        handle: p.handle,
        image: p.featuredImage?.url,
        price: Number(p.variants.edges[0]?.node?.price?.amount || 0),
        compare_price: Number(p.variants.edges[0]?.node?.compareAtPrice?.amount || 0),
        reviewStats: { count: 0, average: 0 }
      }));

    return NextResponse.json({ products }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error("Similar Products API Error:", error);
    return NextResponse.json({ products: [], error: error.message });
  }
}
