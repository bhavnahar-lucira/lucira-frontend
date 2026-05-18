import { shopifyStorefrontFetch } from "@/lib/shopify";
import CollectionPageClient from "./CollectionPageClient";
import { getCollectionSchema, getBreadcrumbSchema } from "@/lib/seo";

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
  
  const data = await shopifyStorefrontFetch(query, { handle });
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

export default async function Page({ params }) {
  const { handle } = await params;
  const collection = await getCollectionData(handle);

  if (!collection && handle !== "all") {
    return <CollectionPageClient params={params} />;
  }

  const collectionSchema = collection ? getCollectionSchema(collection, collection.products?.nodes || []) : [];
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: collection?.title || "All Products", url: `/collections/${handle}` }
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbs);

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
      <CollectionPageClient params={params} />
    </>
  );
}
