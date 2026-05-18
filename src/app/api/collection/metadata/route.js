import { NextResponse } from "next/server";
import { shopifyStorefrontFetch } from "@/lib/shopify";

const COLLECTION_METADATA_QUERY = `
  query GetCollectionMetadata($handle: String!) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo {
        title
        description
      }
      faqquestion: metafield(namespace: "custom", key: "faqquestion") { value }
      faqanswers: metafield(namespace: "custom", key: "faqanswers") { value }
      faqQuestion: metafield(namespace: "custom", key: "FaqQuestion") { value }
      faqAnswers: metafield(namespace: "custom", key: "FaqAnswers") { value }
      faq_section: metafield(namespace: "custom", key: "faq_section") { value }
      seocontent: metafield(namespace: "custom", key: "seocontent") { value }
      seo_content: metafield(namespace: "custom", key: "seo_content") { value }
      seoContent: metafield(namespace: "custom", key: "SEO Content") { value }
      bestseller_products: metafield(namespace: "custom", key: "bestseller_products") { value }
      bestsellers_data: metafield(namespace: "custom", key: "bestsellers_data") { value }
      bestsellers: metafield(namespace: "custom", key: "bestsellers") { value }
    }
  }
`;

const PAGE_CONTENT_QUERY = `
  query GetPageContent($id: ID!) {
    node(id: $id) {
      ... on Page {
        body
      }
    }
  }
`;

const COLLECTION_PRODUCTS_QUERY = `
  query GetCollectionProducts($id: ID!) {
    node(id: $id) {
      ... on Collection {
        products(first: 10) {
          edges {
            node {
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
      }
    }
  }
`;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get("handle");

    if (!handle) {
      return NextResponse.json({ error: "Handle is required" }, { status: 400 });
    }

    const data = await shopifyStorefrontFetch(COLLECTION_METADATA_QUERY, { handle });
    const shopifyCollection = data?.collection;

    if (!shopifyCollection) {
      return NextResponse.json({ success: false, message: "Collection not found" });
    }

    const collection = {
      handle: shopifyCollection.handle,
      title: shopifyCollection.title,
      description: shopifyCollection.description,
      seo: shopifyCollection.seo,
      metafields: {
        "custom.faqquestion": shopifyCollection.faqquestion?.value || shopifyCollection.faqQuestion?.value,
        "custom.faqanswers": shopifyCollection.faqanswers?.value || shopifyCollection.faqAnswers?.value,
        "custom.faq_section": shopifyCollection.faq_section?.value,
        "custom.seocontent": shopifyCollection.seocontent?.value || shopifyCollection.seo_content?.value || shopifyCollection.seoContent?.value,
      },
      bestsellerProducts: []
    };

    let seoContent = collection.metafields["custom.seocontent"];
    if (seoContent && typeof seoContent === "string" && (seoContent.startsWith("gid://shopify/Page/") || seoContent.startsWith("gid://shopify/OnlineStorePage/"))) {
      try {
        const normalizedId = seoContent.replace("OnlineStorePage", "Page");
        const pageData = await shopifyStorefrontFetch(PAGE_CONTENT_QUERY, { id: normalizedId });
        if (pageData?.node?.body) {
          collection.metafields["custom.seocontent"] = pageData.node.body;
        }
      } catch (e) {
        console.warn("Failed to resolve SEO page content:", e.message);
      }
    }

    const rawBestsellers = shopifyCollection.bestseller_products?.value || shopifyCollection.bestsellers_data?.value || shopifyCollection.bestsellers?.value;
    if (rawBestsellers) {
        if (rawBestsellers.startsWith("gid://shopify/Collection/")) {
            try {
                const collectionData = await shopifyStorefrontFetch(COLLECTION_PRODUCTS_QUERY, { id: rawBestsellers });
                const products = collectionData?.node?.products?.edges || [];
                collection.bestsellerProducts = products.map(({ node: p }) => ({
                    title: p.title,
                    handle: p.handle,
                    image: p.featuredImage?.url,
                    price: Number(p.variants.edges[0]?.node?.price?.amount || 0)
                }));
            } catch(e) {
                console.warn("Failed to fetch products for bestseller collection reference:", e.message);
            }
        } else if (rawBestsellers.startsWith("gid://shopify/")) {
            try {
                const normalizedId = rawBestsellers.replace("OnlineStorePage", "Page");
                const pageData = await shopifyStorefrontFetch(PAGE_CONTENT_QUERY, { id: normalizedId });
                if (pageData?.node?.body) {
                    try {
                        collection.bestsellerProducts = JSON.parse(pageData.node.body);
                    } catch(e) {
                        collection.metafields["custom.bestsellers_html"] = pageData.node.body;
                    }
                }
            } catch(e) {}
        } else {
            try {
                collection.bestsellerProducts = JSON.parse(rawBestsellers);
            } catch(e) {}
        }
    }

    return NextResponse.json({
      success: true,
      collection,
    });
  } catch (error) {
    console.error("Failed to fetch collection metadata from Shopify:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
