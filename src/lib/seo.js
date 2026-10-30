import { storesForSurface, designsLink, STORE_SURFACES } from "@/lib/storeContent";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";

export const organizationSchema = {
  "@type": "Organization",
  "@id": `${baseUrl}/#org`,
  "name": "Lucira Jewelry",
  "description": "Shop from Lucira Jewelry for Official Lab Grown diamond rings, necklaces, and bracelets. Elegant and ethical designs crafted for modern India's style.",
  "url": `${baseUrl}/`,
  "alternateName": "Lu-see-ra",
  "logo": {
    "@type": "ImageObject",
    "@id": `${baseUrl}/#logo`,
    "url": "https://luciraonline.myshopify.com/cdn/shop/files/LJ_Logo_Pink.svg?v=1759481962&width=240"
  },
  "image": {
    "@type": "ImageObject",
    "url": "https://luciraonline.myshopify.com/cdn/shop/files/Stackable-Desktop_1.jpg"
  },
  "sameAs": [
    "https://www.instagram.com/lucirajewelry/",
    "https://www.youtube.com/@Lucira_Jewelry",
    "https://in.pinterest.com/lucira_jewelry/",
    "https://www.facebook.com/lucirajewelry",
    "https://www.linkedin.com/company/lucira-jewelry"
  ],
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "care@lucirajewelry.com",
      "telephone": "+91-9004436052",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi"]
    }
  ],
  "email": "care@lucirajewelry.com",
  "telephone": "+91-9004436052",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Office 1402-2, Dlh Park, 14th Floor, SV Rd",
    "addressLocality": "Goregaon West",
    "addressRegion": "Mumbai, Maharashtra",
    "postalCode": "400062",
    "addressCountry": "IN"
  },
  "founder": {
    "@type": "Person",
    "@id": `${baseUrl}/#founder`,
    "name": "Rupesh Jain",
    "jobTitle": "Founder & CEO",
    "sameAs": ["https://www.linkedin.com/in/rupesh-jain", "https://www.instagram.com/rupeshjane/"]
  },
  "vatID": "27AALCD1697E1ZF",
  "knowsAbout": [
    "lab grown diamond jewelry",
    "diamond engagement rings",
    "diamond necklaces and pendants",
    "diamond earrings",
    "bracelets",
    "mangalsutra",
    "ethical jewelry",
    "wedding rings",
    "custom jewelry design"
  ]
};

export const websiteSchema = {
  "@type": "WebSite",
  "@id": `${baseUrl}/#website`,
  "url": `${baseUrl}/`,
  "name": "Lucira Jewelry",
  "publisher": { "@id": `${baseUrl}/#org` },
  "inLanguage": "en",
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${baseUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
};

// State → the two-letter code the old hand-written entries used. Read off the
// dashboard address (or the city, where the address never names the state —
// "Borivali East, Mumbai - 400066").
const REGION_BY_PLACE = [
  [/maharashtra|mumbai|pune/i, "MH"],
  [/delhi/i, "DL"],
  [/uttar pradesh|noida/i, "UP"],
  [/karnataka|bengaluru|bangalore/i, "KA"],
];

const absoluteUrl = (path) => (/^https?:\/\//.test(path) ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`);

function storeAddressSchema(store) {
  const address = String(store.address || "").trim();
  const postalCode = (address.match(/\b\d{6}\b(?!.*\b\d{6}\b)/) || [])[0];
  const region = REGION_BY_PLACE.find(([pattern]) => pattern.test(`${address} ${store.city || ""}`))?.[1];
  return {
    "@type": "PostalAddress",
    "streetAddress": address,
    "addressLocality": store.city || undefined,
    "addressRegion": region,
    "postalCode": postalCode,
    "addressCountry": "IN",
  };
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKEND = ["Saturday", "Sunday"];
const isTime = (t) => /^\d{1,2}:\d{2}$/.test(String(t || ""));

function openingHoursSchema(hours) {
  return [
    [WEEKDAYS, hours?.weekday],
    [WEEKEND, hours?.weekend],
  ]
    .filter(([, h]) => isTime(h?.open) && isTime(h?.close))
    .map(([days, h]) => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": days,
      "opens": h.open,
      "closes": h.close,
    }));
}

/**
 * One Store entry per physical store, built from the dashboard's store content
 * (Dashboard → Stores, see lib/storeContent.js) — so a store added, edited or
 * closed there is reflected here with no code change.
 *
 * The stores listed are the ones the store locator shows, minus the two kinds
 * a shopper cannot walk into yet: the head office (`visitable: false`) and a
 * store still marked Opening Soon, which joins on its own once it opens.
 *
 * Each entry points at the store's own page and its own photo, not the
 * homepage and the logo. There is no aggregateRating: the dashboard keeps a
 * star value but no review count, which the property requires, and Google
 * does not show stars a business publishes about itself anyway.
 */
export function getStoresSchema(storePages) {
  return storesForSurface(storePages, STORE_SURFACES.storeLocator)
    .filter((store) => store.visitable !== false && store.status !== "opening_soon")
    .map((store) => {
      const image = store.images?.locator || store.images?.homepage || store.images?.collection?.[0] || organizationSchema.image.url;
      const lat = Number(store.geo?.lat);
      const lng = Number(store.geo?.lng);
      const hours = openingHoursSchema(store.hours);
      const phone = String(store.phone || "").replace(/[^\d+]/g, "");
      return {
        "@type": "Store",
        "@id": `${baseUrl}/#${store.handle}`,
        "name": store.name,
        "url": absoluteUrl(designsLink(store)),
        "image": image,
        ...(phone ? { "telephone": phone } : {}),
        ...(store.email ? { "email": store.email } : {}),
        "parentOrganization": { "@id": `${baseUrl}/#org` },
        "address": storeAddressSchema(store),
        ...(lat && lng ? { "geo": { "@type": "GeoCoordinates", "latitude": lat, "longitude": lng } } : {}),
        ...(store.links?.map ? { "hasMap": store.links.map } : {}),
        ...(hours.length ? { "openingHoursSpecification": hours } : {}),
      };
    });
}

export function getBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`
    }))
  };
}

export function getProductSchema(product) {
  const price = product.price || 0;
  const comparePrice = product.compare_price || product.compareAtPrice || price;
  
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "description": product.description?.replace(/<[^>]*>?/gm, '').slice(0, 300),
    "image": product.images?.map(img => img.url) || [product.image],
    "sku": product.variants?.[0]?.sku || product.shopifyId,
    "brand": {
      "@type": "Brand",
      "name": "Lucira Jewelry"
    },
    "url": `${baseUrl}/products/${product.handle}`,
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/products/${product.handle}`,
      "priceCurrency": "INR",
      "price": price,
      "priceValidUntil": "2026-12-31",
      "availability": product.variants?.[0]?.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "eligibleRegion": {
        "@type": "Country",
        "name": "India"
      },
      "seller": {
        "@type": "Organization",
        "name": "Lucira Jewelry"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.reviews?.average || 4.8,
      "reviewCount": product.reviews?.count || 120
    }
  };
}

export function getCollectionSchema(collection, products = []) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": collection.title,
      "description": collection.description?.replace(/<[^>]*>?/gm, ''),
      "url": `${baseUrl}/collections/${collection.handle}`,
      "image": collection.image ? [collection.image.url] : []
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": products.map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": product.title,
        "description": product.description?.replace(/<[^>]*>?/gm, '').slice(0, 160),
        "url": `${baseUrl}/products/${product.handle}`
      }))
    }
  ];
}

export function getArticleSchema(article, blogHandle) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/blogs/${blogHandle}/${article.handle}`
    },
    "headline": article.title,
    "description": article.excerpt || article.content?.replace(/<[^>]*>?/gm, '').slice(0, 160),
    "image": article.image?.url ? [article.image.url] : [],
    "author": {
      "@type": "Person",
      "name": article.author_name?.value || article.authorV2?.name || "Lucira Jewelry"
    },
    "publisher": {
      "@id": `${baseUrl}/#org`
    },
    "datePublished": article.publishedAt,
    "dateModified": article.updatedAt || article.publishedAt,
    "url": `${baseUrl}/blogs/${blogHandle}/${article.handle}`,
    "articleSection": blogHandle,
    "keywords": [blogHandle, ...(article.tags || [])],
    "inLanguage": "en",
    "isPartOf": {
      "@type": "Blog",
      "name": blogHandle,
      "url": `${baseUrl}/blogs/${blogHandle}`
    }
  };
}
