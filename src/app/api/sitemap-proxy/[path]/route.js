import { NextRequest } from "next/server";

export async function GET(request, { params }) {
  const { path } = await params;
  const { searchParams } = request.nextUrl;

  if (!path) {
    return new Response("Path missing in dynamic segment", { status: 400 });
  }

  const SHOP = "luciraonline";
  const rawStore = process.env.SHOPIFY_STORE || process.env.SHOPIFYSTORE || SHOP;
  const shopifyDomain = rawStore.includes(".") ? rawStore : `${rawStore}.myshopify.com`;
  
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const ourBaseUrl = `${protocol}://${host}`;

  try {
    // Construct the Shopify URL
    // Decode potential double-encoded entities like &amp; that crawlers sometimes send literally
    let queryString = request.nextUrl.search || "";
    if (queryString.includes("&amp;") || queryString.includes("&amp%3B")) {
      queryString = queryString.replace(/&amp;/g, "&").replace(/&amp%3B/g, "&");
    }
    
    const shopifySitemapUrl = `https://${shopifyDomain}/${path}${queryString}`;
    

    const res = await fetch(shopifySitemapUrl);
    
    if (!res.ok) {
      console.error(`Shopify sitemap fetch failed: ${res.status}`);
      return new Response("Sitemap not found in Shopify", { status: 404 });
    }

    let xml = await res.text();
    
    // Replace Shopify domains with our dynamic domain
    // 1. Replace the shopify domain itself
    const escapedShopifyDomain = shopifyDomain.replace(/\./g, "\\.");
    const shopifyRegex = new RegExp(`https://${escapedShopifyDomain}`, "g");
    xml = xml.replace(shopifyRegex, ourBaseUrl);
    
    // 2. Replace the production domain if it's hardcoded in Shopify's XML
    xml = xml.replace(/https:\/\/www\.lucirajewelry\.com/g, ourBaseUrl);
    xml = xml.replace(/https:\/\/lucirajewelry\.com/g, ourBaseUrl);

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error("Sitemap proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
