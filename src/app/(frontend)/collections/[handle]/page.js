import { shopifyStorefrontFetch, getAllCollectionHandles } from "@/lib/shopify";
import CollectionPageClient from "./CollectionPageClient";
import { getCollectionSchema, getBreadcrumbSchema } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getStorePages } from "@/lib/storeContent";
import { getMenu } from "@/lib/menus";
import { buildCategoryGroups } from "@/lib/categoryGroups";

export const revalidate = 86400; // 24 hours

async function getCollectionData(handle) {
  const query = `
    query CollectionSchema($handle: String!) {
      collectionByHandle(handle: $handle) {
        title
        handle
        description
        descriptionHtml
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

  // Revalidate frequently so Shopify admin updates reflect quickly
  const data = await shopifyStorefrontFetch(
    query, 
    { handle }, 
    process.env.NODE_ENV === 'development' 
      ? { cache: 'no-store' } 
      : { next: { revalidate: 60 } }
  );
  return data?.collectionByHandle;
}

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const collection = await getCollectionData(handle);

  if (handle === "jewellery-on-emi") {
    const title = collection?.seo?.title || collection?.title || "Buy Diamond Jewellery on EMI Online";
    const description = collection?.seo?.description || collection?.description?.slice(0, 160) || "Explore diamond jewellery on emi at Lucira. Discover thoughtful designs for everyday wear and special occasions, and find jewellery that reflects your.";
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: collection?.image ? [collection.image.url] : [],
      },
      alternates: {
        canonical: `/collections/${handle}`,
      },
    };
  }
  if (handle === "all") {
    const title = collection?.seo?.title || "Buy Lab Grown Diamond Jewellery Online in India";
    const description = collection?.seo?.description || "Discover lab grown diamond rings, earrings, necklaces and bracelets in one place. Browse modern designs and shop online at Lucira.";
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: collection?.image ? [collection.image.url] : [],
      },
      alternates: {
        canonical: `/collections/${handle}`,
      },
    };
  }
  if (handle === "jewelry") {
    const title = collection?.seo?.title || "Shop Lab Grown Diamond Jewellery Online";
    const description = collection?.seo?.description || "Browse modern lab grown diamond jewellery for gifting and everyday wear. Explore rings, earrings, pendants and more at Lucira.";
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: collection?.image ? [collection.image.url] : [],
      },
      alternates: {
        canonical: `/collections/${handle}`,
      },
    };
  }
  if (handle === "paschim-vihar") {
    const title = collection?.seo?.title || "Jewellery Store in Paschim Vihar | Lucira";
    const description = collection?.seo?.description || "Explore Lucira jewellery and discover rings, earrings and more. Check store information and available shopping services before visiting.";
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: collection?.image ? [collection.image.url] : [],
      },
      alternates: {
        canonical: `/collections/${handle}`,
      },
    };
  }
  if (handle === "lab-grown-diamonds-in-mumbai") {
    const title = collection?.seo?.title || "Buy Lab Grown Diamond Jewellery in Mumbai";
    const description = collection?.seo?.description || "Explore lab grown diamonds in mumbai at Lucira. Discover thoughtful designs for everyday wear and special occasions, and find jewellery that reflects your.";
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: collection?.image ? [collection.image.url] : [],
      },
      alternates: {
        canonical: `/collections/${handle}`,
      },
    };
  }

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
    { handle: "pendants" },
    { handle: "jewellery-on-emi" }
  ];
}

export default async function Page({ params }) {
  const { handle } = await params;
  const collection = await getCollectionData(handle);

  const VIRTUAL_HANDLES = new Set(["all", "jewellery-on-emi", "jewelry", "paschim-vihar", "lab-grown-diamonds-in-mumbai"]);
  if (!collection && !VIRTUAL_HANDLES.has(handle)) {
    notFound();
  }

  const collectionSchema = collection ? getCollectionSchema(collection, collection.products?.nodes || []) : [];
  const breadcrumbTitle = collection?.title || (
    handle === "all"
      ? "Lab Grown Diamond Jewellery"
      : handle === "jewelry"
        ? "Lab Grown Diamond Jewellery Online"
        : handle === "paschim-vihar"
          ? "Jewellery Store in Paschim Vihar"
          : handle === "lab-grown-diamonds-in-mumbai"
            ? "Lab Grown Diamonds In Mumbai"
            : "All Products"
  );
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: breadcrumbTitle, url: `/collections/${handle}` }
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbs);

  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim() !== "")
    ? process.env.NEXT_PUBLIC_BACKEND_URL
    : "http://127.0.0.1:8080";
  const base = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;

  // Dashboard-managed store content — decides whether this collection renders
  // the store hero, and supplies everything in it.
  const storePages = await getStorePages();

  // "Shop by …" carousels for this collection, built here from the menu so the
  // client never has to import the menu JSON. Same function, same input the
  // client used to call on mount, so the groups are identical.
  const categoryGroups = buildCategoryGroups(await getMenu("main-menu-official"), handle);

  let initialData = null;
  try {
    const [collRes, filterRes, plpBannersRes, emiSettingsRes] = await Promise.all([
      fetch(`${base}/api/collection?handle=${handle}&limit=16&sort=manual`, { cache: 'force-cache' }),
      fetch(`${base}/api/products/filters?handle=${handle}`, { cache: 'force-cache' }),
      fetch(`${base}/api/settings/plp-banners`, { cache: 'force-cache' }),
      handle === "jewellery-on-emi"
        ? fetch(`${base}/api/settings/jewellery-on-emi`, { cache: 'force-cache' }).catch(() => null)
        : Promise.resolve(null),
    ]);
    let plpBanners = null;
    if (plpBannersRes.ok) {
      plpBanners = await plpBannersRes.json().catch(() => null);
    }
    let emiSettings = null;
    if (emiSettingsRes && emiSettingsRes.ok) {
      emiSettings = await emiSettingsRes.json().catch(() => null);
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
        if (!collData.collection.descriptionHtml && collection?.descriptionHtml) {
          collData.collection.descriptionHtml = collection.descriptionHtml;
        }
      } else if (collData && collection) {
        collData.collection = {
          title: collection.title,
          handle: collection.handle,
          description: collection.description,
          descriptionHtml: collection.descriptionHtml,
          seo: collection.seo,
          image: collection.image,
        };
      }

      // Keep product descriptions lean in the grid and filter hidden products
      if (collData?.products) {
        collData.products = collData.products.filter(p => !p.tags?.some(t => t?.toLowerCase() === 'hidden'));
        collData.products.forEach(p => {
          delete p.descriptionHtml;
        });
      }

      initialData = { collData, filterData: filterDataObj || {}, plpBanners, emiSettings };
    }
  } catch (e) {
    console.error("Failed to fetch initial data for SSG", e);
  }

  // Check if collection is empty after fetching data
  if (!VIRTUAL_HANDLES.has(handle) && initialData?.collData && (!initialData.collData.products || initialData.collData.products.length === 0)) {
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
      <CollectionPageClient 
        params={params} 
        initialData={initialData} 
        storePages={storePages} 
        collectionData={collection}
        categoryGroups={categoryGroups}
      />
    </>
  );
}
