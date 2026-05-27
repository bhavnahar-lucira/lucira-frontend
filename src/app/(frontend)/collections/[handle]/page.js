import { shopifyStorefrontFetch, getAllCollectionHandles } from "@/lib/shopify";
import CollectionPageClient from "./CollectionPageClient";
import { getCollectionSchema, getBreadcrumbSchema } from "@/lib/seo";

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
  
  const data = await shopifyStorefrontFetch(query, { handle }, { next: { revalidate: 86400 } });
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
  // Pre-render only the "/collections/all" page during build time.
  // The rest of the collections will be generated dynamically on-demand when first requested, 
  // keeping your build fast and light.
  return [{ handle: "all" }];
}

export default async function Page({ params }) {
  const { handle } = await params;
  const collection = await getCollectionData(handle);

  if (!collection && handle !== "all") {
    return <CollectionPageClient params={params} initialData={null} />;
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
  
  let initialData = null;
  try {
    const [collRes, filterRes] = await Promise.all([
      fetch(`${base}/api/collection?handle=${handle}&limit=25&sort=best_selling`, { next: { revalidate: 86400 } }),
      fetch(`${base}/api/products/filters?handle=${handle}`, { next: { revalidate: 86400 } })
    ]);
    if (collRes.ok && filterRes.ok) {
      const collData = await collRes.json();
      const filterDataObj = await filterRes.json();
      initialData = { collData, filterData: filterDataObj || {} };
    }
  } catch(e) {
    console.error("Failed to fetch initial data for SSG", e);
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
      <CollectionPageClient params={params} initialData={initialData} />
    </>
  );
}
