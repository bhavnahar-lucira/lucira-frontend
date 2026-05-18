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

export const storesSchema = [
  {
    "@type": "Store",
    "@id": `${baseUrl}/#chembur-store`,
    "name": "Chembur Lucira Store",
    "url": `${baseUrl}/`,
    "image": "https://luciraonline.myshopify.com/cdn/shop/files/LJ_Logo_Pink.svg?v=1759481962",
    "telephone": "+919004402038",
    "parentOrganization": { "@id": `${baseUrl}/#org` },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Shop No. 3, Ground Floor, 487, Geraldine CHS LTD, Central Ave Rd",
      "addressLocality": "Chembur",
      "addressRegion": "MH",
      "postalCode": "400071",
      "addressCountry": "IN"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "76"
    }
  },
  {
    "@type": "Store",
    "@id": `${baseUrl}/#pune-store`,
    "name": "Pune Lucira Store",
    "url": `${baseUrl}/`,
    "image": "https://luciraonline.myshopify.com/cdn/shop/files/LJ_Logo_Pink.svg?v=1759481962",
    "telephone": "+918433667236",
    "parentOrganization": { "@id": `${baseUrl}/#org` },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Shop No. 3, 4, Balgandharv Chowk, Sai Square, 5 & 6, Jangali Maharaj Rd",
      "addressLocality": "Pune",
      "addressRegion": "MH",
      "postalCode": "411005",
      "addressCountry": "IN"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "86"
    }
  },
  {
    "@type": "Store",
    "@id": `${baseUrl}/#borivali-store`,
    "name": "Sky City Borivali Store",
    "url": `${baseUrl}/`,
    "image": "https://luciraonline.myshopify.com/cdn/shop/files/LJ_Logo_Pink.svg?v=1759481962",
    "telephone": "+918433667238",
    "parentOrganization": { "@id": `${baseUrl}/#org` },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Sky City Mall, S-40, 2nd Floor, Western Express Hwy",
      "addressLocality": "Borivali East",
      "addressRegion": "MH",
      "postalCode": "400066",
      "addressCountry": "IN"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "86"
    }
  }
];

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
