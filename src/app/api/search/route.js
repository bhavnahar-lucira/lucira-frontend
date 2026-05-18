import { NextResponse } from "next/server";
import { shopifyStorefrontFetch } from "@/lib/shopify";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const SEARCH_QUERY = `
      query SearchProducts($query: String!) {
        products(query: $query, first: 10) {
          edges {
            node {
              id
              title
              handle
              featuredImage { url }
              variants(first: 1) {
                edges {
                  node {
                    price { amount }
                  }
                }
              }
            }
          }
        }
        collections(query: $query, first: 3) {
          edges {
            node {
              id
              title
              handle
              image { url }
            }
          }
        }
      }
    `;

    const data = await shopifyStorefrontFetch(SEARCH_QUERY, { query });

    const products = (data?.products?.edges || []).map(({ node: p }) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      image: p.featuredImage?.url,
      price: p.variants.edges[0]?.node?.price?.amount 
        ? `₹${Number(p.variants.edges[0].node.price.amount).toLocaleString("en-IN")}` 
        : "Price on request",
      url: `/products/${p.handle}`,
    }));

    const collections = (data?.collections?.edges || []).map(({ node: c }) => ({
      id: c.id,
      title: c.title,
      handle: c.handle,
      image: c.image?.url,
      price: "Collection",
      url: `/collections/${c.handle}`,
      isCollection: true
    }));

    const results = [...collections, ...products];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Shopify Search error:", error);
    return NextResponse.json({ results: [] });
  }
}
