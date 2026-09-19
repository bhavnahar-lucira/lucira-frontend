import { shopifyStorefrontFetch, getAllCollectionHandles } from "@/lib/shopify";
import CollectionPageClient from "./CollectionPageClient";
import { getCollectionSchema, getBreadcrumbSchema } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getStorePages } from "@/lib/storeContent";

export const revalidate = 86400; // 24 hours

async function getCollectionData(handle) {
  const query = `
    query CollectionSchema($handle: String!) {
      collectionByHandle(handle: $handle) {
        title
        handle
        description
        seo { title description }
        image { url altText }
        products(first: 24) {
          nodes {
            title
            handle
            description
          }
        }
      }
    }
  `;

  // Use force-cache so the fetch is cached and inherits the page-level revalidate=86400
  const data = await shopifyStorefrontFetch(query, { handle }, { cache: 'force-cache' });
  return data?.collectionByHandle;
}

export async function generateMetadata({ params }) {
  const { handle } = await params;
  if (handle === "all") {
    return {
      title: "All Lab Grown Diamond Jewelry | Lucira Jewelry",
      description: "Explore our complete collection of ethically sourced, lab-grown diamond jewelry. From stunning rings to elegant necklaces, find your perfect piece at Lucira.",
    };
  }

  const collection = await getCollectionData(handle);
  if (!collection) return {};

  return {
    title: collection.seo?.title || `${collection.title} | Lucira Jewelry`,
    description: collection.seo?.description || collection.description?.slice(0, 160),
    openGraph: {
      title: collection.seo?.title || collection.title,
      description: collection.seo?.description || collection.description?.slice(0, 160),
      images: collection.image ? [collection.image.url] : [],
    },
    alternates: {
      canonical: `/collections/${handle}`,
    },
  };
}

export async function generateStaticParams() {
  return [
    { handle: "rings" },
    { handle: "bestsellers" },
    { handle: "gemstone-jewelry" },
    { handle: "sports-collection" },
    { handle: "cotton-candy" },
    { handle: "hexa" },
    { handle: "9kt-collection" },
    { handle: "lucira-express" },
    { handle: "necklaces" },
    { handle: "bracelets" },
    { handle: "pendants" }
  ];
}

export default async function Page({ params }) {
  const { handle } = await params;
  const collection = await getCollectionData(handle);

  if (!collection && handle !== "all") {
    notFound();
  }

  const collectionSchema = collection ? getCollectionSchema(collection, collection.products?.nodes || []) : [];
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: collection?.title || "All Products", url: `/collections/${handle}` }
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbs);

  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim() !== "")
    ? process.env.NEXT_PUBLIC_BACKEND_URL
    : "http://127.0.0.1:8080";
  const base = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;

  // Dashboard-managed store content — decides whether this collection renders
  // the store hero, and supplies everything in it.
  const storePages = await getStorePages();

  let initialData = null;
  try {
    const [collRes, filterRes, plpBannersRes] = await Promise.all([
      fetch(`${base}/api/collection?handle=${handle}&limit=16&sort=manual`, { cache: 'force-cache' }),
      fetch(`${base}/api/products/filters?handle=${handle}`, { cache: 'force-cache' }),
      fetch(`${base}/api/settings/plp-banners`, { cache: 'force-cache' })
    ]);
    let plpBanners = null;
    if (plpBannersRes.ok) {
      plpBanners = await plpBannersRes.json().catch(() => null);
    }
    if (collRes.ok && filterRes.ok) {
      const collData = await collRes.json();
      const filterDataObj = await filterRes.json();

      // Prune massive unused data to save Vercel bandwidth
      if (collData?.collection) {
        // delete collData.collection.descriptionHtml;
        if (collData.collection.metafields?.custom) {
          delete collData.collection.metafields.custom.bestsellers_html;
          delete collData.collection.metafields.custom.seo_content_data;
        }
      }

      // Keep product descriptions lean in the grid and filter hidden products
      if (collData?.products) {
        collData.products = collData.products.filter(p => !p.tags?.some(t => t?.toLowerCase() === 'hidden'));
        collData.products.forEach(p => {
          delete p.descriptionHtml;
        });
      }

      initialData = { collData, filterData: filterDataObj || {}, plpBanners };
    }
  } catch (e) {
    console.error("Failed to fetch initial data for SSG", e);
  }

  // Check if collection is empty after fetching data
  if (initialData?.collData && (!initialData.collData.products || initialData.collData.products.length === 0)) {
    if (!initialData.collData.pageInfo?.hasNextPage) {
      notFound();
    }
  }

  return (
    <>
      {collectionSchema.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <CollectionPageClient params={params} initialData={initialData} storePages={storePages} />
    </>
  );
}
