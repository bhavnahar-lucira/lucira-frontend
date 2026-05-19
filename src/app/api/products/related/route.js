import { NextResponse } from "next/server";
import { shopifyStorefrontFetch } from "@/lib/shopify";

const mapProduct = (p) => {
  if (!p) return null;

  return {
    id: p.id.split("/").pop(),
    shopifyId: p.id,
    title: p.title,
    handle: p.handle,
    image: p.featuredImage?.url,
    price: Number(p.variants?.edges?.[0]?.node?.price?.amount || 0),
    compare_price: Number(p.variants?.edges?.[0]?.node?.compareAtPrice?.amount || 0),
    reviewStats: { count: 0, average: 0 },
  };
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get("handle");

    if (!handle) {
      return NextResponse.json({ complementaryProducts: [], matchingProducts: [] }, { status: 400 });
    }

    const RELATED_PRODUCTS_QUERY = `
      query getRelatedProducts($handle: String!) {
        product(handle: $handle) {
          id
          matching_products: metafield(namespace: "custom", key: "matching_product") {
            value
            reference {
              ... on Product {
                id title handle featuredImage { url }
                variants(first: 1) { edges { node { price { amount } compareAtPrice { amount } } } }
              }
            }
            references(first: 10) {
              edges {
                node {
                  ... on Product {
                    id title handle featuredImage { url }
                    variants(first: 1) { edges { node { price { amount } compareAtPrice { amount } } } }
                  }
                }
              }
            }
          }
          complementary_products: metafield(namespace: "shopify--discovery--product_recommendation", key: "complementary_products") {
            references(first: 10) {
              edges {
                node {
                  ... on Product {
                    id title handle featuredImage { url }
                    variants(first: 1) { edges { node { price { amount } compareAtPrice { amount } } } }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await shopifyStorefrontFetch(
      RELATED_PRODUCTS_QUERY,
      { handle },
      { next: { revalidate: 3600 } }
    );

    const product = data?.product;
    if (!product) {
      return NextResponse.json({ complementaryProducts: [], matchingProducts: [] });
    }

    const complementaryProducts = (product.complementary_products?.references?.edges || [])
      .map(({ node }) => mapProduct(node))
      .filter(Boolean);

    const matchingProductEdges = product.matching_products?.references?.edges || [];
    const matchingProducts = matchingProductEdges.length > 0
      ? matchingProductEdges.map(({ node }) => mapProduct(node)).filter(Boolean)
      : [mapProduct(product.matching_products?.reference)].filter(Boolean);

    return NextResponse.json(
      { complementaryProducts, matchingProducts },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Related Products API Error:", error);
    return NextResponse.json(
      { complementaryProducts: [], matchingProducts: [], error: error.message },
      { status: 500 }
    );
  }
}
