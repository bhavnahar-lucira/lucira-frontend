// components/sitemap/SitemapPage.jsx
// Usage: add `if (handle === "sitemap") return <SitemapPage />;` in your pages/[handle]/page.js

import Link from "next/link";
import clientPromise from "@/lib/mongodb";

// ─── Hardcoded/Manual Sections (kept from original) ─────────────────────────

const MANUAL_SITEMAP_DATA = [
  {
    section: "JEWELRY",
    url: "/collections",
    columns: [
      {
        title: "RINGS",
        links: [
          { label: "Engagement Rings", href: "/collections/engagement-rings" },
          { label: "Solitaire Rings", href: "/collections/solitaire-rings" },
          { label: "Eternity Rings", href: "/collections/eternity-rings" },
          { label: "Stackable Rings", href: "/collections/stackable-rings" },
          { label: "Casual Rings", href: "/collections/casual-rings" },
          { label: "Men's Ring", href: "/collections/mens-rings" },
        ],
      },
      {
        title: "EARRINGS",
        links: [
          { label: "Studs", href: "/collections/stud-earrings" },
          { label: "Hoops", href: "/collections/hoop-earrings" },
          { label: "Sui Dhagas", href: "/collections/sui-dhaga-earrings" },
          { label: "Dangles", href: "/collections/dangle-earrings" },
        ],
      },
      {
        title: "BRACELETS",
        links: [
          { label: "Chain Bracelets", href: "/collections/chain-bracelets" },
          { label: "Tennis Bracelets", href: "/collections/tennis-bracelets" },
          { label: "Cuff Bracelets", href: "/collections/cuff-bracelets" },
          {
            label: "Mangalsutra Bracelets",
            href: "/collections/mangalsutra-bracelets",
          },
        ],
      },
      {
        title: "NECKLACES",
        links: [
          { label: "Chain Necklaces", href: "/collections/chain-necklaces" },
          {
            label: "Pendant Necklaces",
            href: "/collections/pendant-necklaces",
          },
          {
            label: "Mangalsutra Necklaces",
            href: "/collections/mangalsutra-necklaces",
          },
          { label: "Tennis Necklace", href: "/collections/tennis-necklaces" },
        ],
      },
      {
        title: "OTHERS",
        links: [
          { label: "Nose Pins", href: "/collections/nose-pins" },
          { label: "Men's Stud", href: "/collections/mens-stud" },
        ],
      },
      {
        title: "EDUCATION",
        links: [
          {
            label: "Hoop Earring Styles",
            href: "/blogs/stories/hoop-earring-styles",
          },
          {
            label: "Different Types of Diamond",
            href: "/blogs/stories/types-of-diamond",
          },
          {
            label: "Jewelry Trends 2026",
            href: "/blogs/stories/jewelry-trends-2026",
          },
          {
            label: "How to Read Certificate",
            href: "/blogs/stories/how-to-read-certificate",
          },
        ],
      },
    ],
  },
  {
    section: "ENGAGEMENT RINGS",
    url: "/collections/engagement-rings",
    columns: [
      {
        title: "SHOP BY STYLE",
        links: [
          {
            label: "Solitaire",
            href: "/collections/solitaire-engagement-rings",
          },
          { label: "Halo", href: "/collections/halo-engagement-rings" },
          {
            label: "Side Stone",
            href: "/collections/side-stone-engagement-rings",
          },
          {
            label: "Toi et Moi",
            href: "/collections/toi-et-moi-engagement-rings",
          },
          {
            label: "Trilogy",
            href: "/collections/trilogy-engagement-rings",
          },
          {
            label: "Women's",
            href: "/collections/womens-engagement-rings",
          },
          { label: "Men's", href: "/collections/mens-engagement-rings" },
        ],
      },
      {
        title: "SHOP BY SHAPE",
        links: [
          {
            label: "Round",
            href: "/collections/round-engagement-rings",
          },
          {
            label: "Princess",
            href: "/collections/princess-engagement-rings",
          },
          { label: "Oval", href: "/collections/oval-engagement-rings" },
          {
            label: "Cushion",
            href: "/collections/cushion-engagement-rings",
          },
          {
            label: "Emerald",
            href: "/collections/emerald-engagement-rings",
          },
          { label: "Pear", href: "/collections/pear-engagement-rings" },
          {
            label: "Marquise",
            href: "/collections/marquise-engagement-rings",
          },
          { label: "Heart", href: "/collections/heart-engagement-rings" },
        ],
      },
      {
        title: "SHOP BY MATERIAL",
        links: [
          {
            label: "Yellow Gold",
            href: "/collections/yellow-gold-engagement-rings",
          },
          {
            label: "White Gold",
            href: "/collections/white-gold-engagement-rings",
          },
          {
            label: "Rose Gold",
            href: "/collections/rose-gold-engagement-rings",
          },
        ],
      },
      {
        title: "SHOP BY PRICE",
        links: [
          {
            label: "Below 50K",
            href: "/collections/engagement-rings-below-50k",
          },
          {
            label: "50K – 100K",
            href: "/collections/engagement-rings-50k-100k",
          },
          {
            label: "100K – 150K",
            href: "/collections/engagement-rings-100k-150k",
          },
          {
            label: "150K – 200K",
            href: "/collections/engagement-rings-150k-200k",
          },
        ],
      },
      {
        title: "SHOP BY SIZE",
        links: [
          {
            label: "0.25 ct – 0.49 ct",
            href: "/collections/engagement-rings-0-25ct",
          },
          {
            label: "0.50 ct – 0.99 ct",
            href: "/collections/engagement-rings-0-50ct",
          },
          {
            label: "1.00 ct – 1.49 ct",
            href: "/collections/engagement-rings-1-00ct",
          },
          {
            label: "1.50 ct – 1.99 ct",
            href: "/collections/engagement-rings-1-50ct",
          },
          {
            label: "2.00 ct and above",
            href: "/collections/engagement-rings-2ct-above",
          },
        ],
      },
      {
        title: "EDUCATION",
        links: [
          {
            label: "Resetting Engagement Ring",
            href: "/blogs/stories/resetting-engagement-ring",
          },
          {
            label: "Ideas for Custom Ring",
            href: "/blogs/stories/custom-ring-ideas",
          },
          {
            label: "Perfect Engagement Ring",
            href: "/blogs/stories/perfect-engagement-ring",
          },
          {
            label: "What Are Engagement Rings",
            href: "/blogs/stories/what-are-engagement-rings",
          },
        ],
      },
    ],
  },
  {
    section: "WEDDING RINGS",
    url: "/collections/wedding-rings",
    columns: [
      {
        title: "SHOP BY STYLE",
        links: [
          { label: "Eternity", href: "/collections/eternity-wedding-rings" },
          {
            label: "Stackable",
            href: "/collections/stackable-wedding-rings",
          },
          {
            label: "Gemstone",
            href: "/collections/gemstone-wedding-rings",
          },
          {
            label: "Women's",
            href: "/collections/womens-wedding-rings",
          },
          { label: "Men's", href: "/collections/mens-wedding-rings" },
        ],
      },
      {
        title: "SHOP BY SHAPE",
        links: [
          { label: "Round", href: "/collections/round-wedding-rings" },
          { label: "Princess", href: "/collections/princess-wedding-rings" },
          { label: "Oval", href: "/collections/oval-wedding-rings" },
          { label: "Cushion", href: "/collections/cushion-wedding-rings" },
          { label: "Emerald", href: "/collections/emerald-wedding-rings" },
          { label: "Pear", href: "/collections/pear-wedding-rings" },
          { label: "Marquise", href: "/collections/marquise-wedding-rings" },
          { label: "Heart", href: "/collections/heart-wedding-rings" },
        ],
      },
      {
        title: "SHOP BY MATERIAL",
        links: [
          {
            label: "Yellow Gold",
            href: "/collections/yellow-gold-wedding-rings",
          },
          {
            label: "White Gold",
            href: "/collections/white-gold-wedding-rings",
          },
          {
            label: "Rose Gold",
            href: "/collections/rose-gold-wedding-rings",
          },
        ],
      },
      {
        title: "SHOP BY PRICE",
        links: [
          { label: "Below 50K", href: "/collections/wedding-rings-below-50k" },
          { label: "50K – 100K", href: "/collections/wedding-rings-50k-100k" },
          {
            label: "100K – 150K",
            href: "/collections/wedding-rings-100k-150k",
          },
          {
            label: "150K – 200K",
            href: "/collections/wedding-rings-150k-200k",
          },
          {
            label: "200K and above",
            href: "/collections/wedding-rings-200k-above",
          },
        ],
      },
      {
        title: "SHOP BY SIZE",
        links: [
          {
            label: "0.25 ct – 0.49 ct",
            href: "/collections/wedding-rings-0-25ct",
          },
          {
            label: "0.50 ct – 0.99 ct",
            href: "/collections/wedding-rings-0-50ct",
          },
          {
            label: "1.00 ct – 1.49 ct",
            href: "/collections/wedding-rings-1-00ct",
          },
          {
            label: "1.50 ct – 1.99 ct",
            href: "/collections/wedding-rings-1-50ct",
          },
          {
            label: "2.00 ct and above",
            href: "/collections/wedding-rings-2ct-above",
          },
        ],
      },
      {
        title: "EDUCATION",
        links: [
          {
            label: "Engagement vs. Wedding",
            href: "/blogs/stories/engagement-vs-wedding-ring",
          },
          {
            label: "Oval vs. Round Diamonds",
            href: "/blogs/stories/oval-vs-round-diamonds",
          },
          { label: "4C's of Diamond", href: "/blogs/stories/4cs-of-diamond" },
          {
            label: "Latest Innovations",
            href: "/blogs/stories/latest-diamond-innovations",
          },
        ],
      },
    ],
  },
  {
    section: "FAVOURITES",
    url: null,
    columns: [
      {
        title: "FAST SHIPPING",
        links: [
          { label: "Rings", href: "/collections/fast-shipping-rings" },
          { label: "Earrings", href: "/collections/fast-shipping-earrings" },
          {
            label: "Bracelets",
            href: "/collections/fast-shipping-bracelets",
          },
          {
            label: "Pendant Necklaces",
            href: "/collections/fast-shipping-pendants",
          },
        ],
      },
      {
        title: "NEW ARRIVALS",
        links: [
          { label: "Rings", href: "/collections/new-arrival-rings" },
          { label: "Earrings", href: "/collections/new-arrival-earrings" },
          { label: "Nose Pins", href: "/collections/new-arrival-nose-pins" },
          {
            label: "Bracelets",
            href: "/collections/new-arrival-bracelets",
          },
          {
            label: "Pendant Necklaces",
            href: "/collections/new-arrival-pendants",
          },
        ],
      },
      {
        title: "TRENDING",
        links: [
          { label: "Rings", href: "/collections/trending-rings" },
          { label: "Earrings", href: "/collections/trending-earrings" },
          { label: "Nose Pins", href: "/collections/trending-nose-pins" },
          { label: "Bracelets", href: "/collections/trending-bracelets" },
          {
            label: "Pendant Necklaces",
            href: "/collections/trending-pendants",
          },
        ],
      },
      {
        title: "EDUCATION",
        links: [
          {
            label: "Online Shopping Tips",
            href: "/blogs/stories/online-shopping-tips",
          },
          {
            label: "How to Read IGI Certificate",
            href: "/blogs/stories/how-to-read-igi-certificate",
          },
        ],
      },
    ],
  },
  {
    section: "SOLITAIRE",
    url: "/collections/solitaire",
    columns: [
      {
        title: "SHOP BY STYLE",
        links: [
          { label: "Rings", href: "/collections/solitaire-rings" },
          { label: "Earrings", href: "/collections/solitaire-earrings" },
          { label: "Bracelets", href: "/collections/solitaire-bracelets" },
          { label: "Necklaces", href: "/collections/solitaire-necklaces" },
          {
            label: "Chain Pendants",
            href: "/collections/solitaire-chain-pendants",
          },
          {
            label: "Men's Solitaire",
            href: "/collections/mens-solitaire",
          },
        ],
      },
      {
        title: "SHOP BY SHAPE",
        links: [
          { label: "Round", href: "/collections/round-solitaire" },
          { label: "Heart", href: "/collections/heart-solitaire" },
          { label: "Oval", href: "/collections/oval-solitaire" },
          { label: "Marquise", href: "/collections/marquise-solitaire" },
          { label: "Princess", href: "/collections/princess-solitaire" },
          { label: "Emerald", href: "/collections/emerald-solitaire" },
          { label: "Pear", href: "/collections/pear-solitaire" },
          { label: "Cushion", href: "/collections/cushion-solitaire" },
        ],
      },
      {
        title: "SHOP BY MATERIAL",
        links: [
          { label: "Yellow Gold", href: "/collections/yellow-gold-solitaire" },
          { label: "White Gold", href: "/collections/white-gold-solitaire" },
          { label: "Rose Gold", href: "/collections/rose-gold-solitaire" },
        ],
      },
      {
        title: "SHOP BY PRICE",
        links: [
          { label: "Below 50K", href: "/collections/solitaire-below-50k" },
          { label: "50K – 100K", href: "/collections/solitaire-50k-100k" },
          { label: "100K – 150K", href: "/collections/solitaire-100k-150k" },
          { label: "150K – 200K", href: "/collections/solitaire-150k-200k" },
          {
            label: "200K and above",
            href: "/collections/solitaire-200k-above",
          },
        ],
      },
      {
        title: "EDUCATION",
        links: [
          {
            label: "The Ultimate Showdown",
            href: "/blogs/stories/ultimate-diamond-showdown",
          },
          {
            label: "Lab Grown vs. Mined",
            href: "/blogs/stories/lab-grown-vs-mined",
          },
        ],
      },
    ],
  },
  {
    section: "COLLECTIONS",
    url: "/collections",
    columns: [
      {
        title: "ON THE MOVE",
        links: [
          { label: "On the Move", href: "/collections/on-the-move" },
        ],
      },
      {
        title: "HEXA",
        links: [{ label: "Hexa", href: "/collections/hexa" }],
      },
      {
        title: "9KT COLLECTION",
        links: [
          { label: "9KT Collection", href: "/collections/9kt-collection" },
        ],
      },
    ],
  },
  {
    section: "GIFTING",
    url: "/collections/gifts",
    columns: [
      {
        title: "GIFTS",
        links: [
          { label: "Birthday Gifts", href: "/collections/birthday-gifts" },
          {
            label: "Anniversary Gifts",
            href: "/collections/anniversary-gifts",
          },
          { label: "Gift for Mother", href: "/collections/gifts-for-mother" },
          { label: "Gifts for Her", href: "/collections/gifts-for-her" },
          { label: "Gifts for Him", href: "/collections/gifts-for-him" },
        ],
      },
      {
        title: "PRICE",
        links: [
          { label: "Gifts Under 30K", href: "/collections/gifts-under-30k" },
          { label: "Gifts Under 50K", href: "/collections/gifts-under-50k" },
          {
            label: "Gifts Under 100K",
            href: "/collections/gifts-under-100k",
          },
        ],
      },
      {
        title: "GIFT FOR HIM",
        links: [
          { label: "Gifts for Him", href: "/collections/gifts-for-him" },
        ],
      },
      {
        title: "GIFT FOR HER",
        links: [
          { label: "Gifts for Her", href: "/collections/gifts-for-her" },
        ],
      },
    ],
  },
  {
    section: "MORE ABOUT LUCIRA",
    url: null,
    columns: [
      {
        title: "ABOUT LUCIRA",
        links: [
          { label: "About Our Company", href: "/pages/about-us" },
          { label: "Terms & Conditions", href: "/pages/terms-and-conditions" },
          { label: "Contact Us", href: "/pages/contact-us" },
          {
            label: "Modern Slavery Policy",
            href: "/pages/modern-slavery-policy",
          },
          {
            label: "Supplier Code of Conduct",
            href: "/pages/supplier-code-of-conduct",
          },
          {
            label: "Offers T&C",
            href: "/pages/exclusive-promotions-page",
          },
          { label: "Privacy Policy", href: "/pages/privacy-policy" },
          { label: "Shipping Policy", href: "/pages/shipping-policy" },
        ],
      },
      {
        title: "EXPERIENCE LUCIRA",
        links: [
          { label: "Careers", href: "/pages/careers" },
          { label: "Purpose and Value", href: "/pages/purpose-and-value" },
          { label: "Rewards", href: "/pages/rewards" },
          { label: "Reviews", href: "/pages/reviews" },
          { label: "Craftsmanship", href: "/pages/craftsmanship" },
          { label: "Featured In", href: "/pages/featured-in" },
          { label: "Bespoke", href: "/pages/bespoke" },
          { label: "Packaging", href: "/pages/packaging" },
          { label: "Franchise", href: "/pages/franchise" },
        ],
      },
      {
        title: "LUCIRA JEWELRY GUIDE",
        links: [
          { label: "Blogs", href: "/blogs/stories" },
          { label: "Diamond Education", href: "/pages/diamond-education" },
          { label: "Metal Education", href: "/pages/metal-education" },
          { label: "Size Guide", href: "/pages/size-guide" },
          { label: "How To Wear", href: "/pages/how-to-wear" },
          { label: "Jewelry Care Tips", href: "/pages/jewelry-care-tips" },
          { label: "LGD vs Mined", href: "/blogs/stories/lgd-vs-mined" },
        ],
      },
      {
        title: "WHY LUCIRA",
        links: [
          { label: "15-Days Return", href: "/pages/return-policy" },
          { label: "Cancel & Refund", href: "/pages/cancellation-policy" },
          {
            label: "Lifetime Exchange & Buyback",
            href: "/pages/exchange-buyback",
          },
        ],
      },
    ],
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SitemapColumn({ title, links }) {
  return (
    <div className="min-w-0">
      {title && (
        <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-900 mb-4 pb-2 border-b border-zinc-200">
          {title}
        </h3>
      )}
      <ul className="space-y-2">
        {links.map((link, idx) => (
          <li key={`${link.href}-${idx}`}>
            <Link
              href={link.href}
              className="text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors duration-150 leading-relaxed block"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SitemapSection({ section, url, columns }) {
  return (
    <div className="pb-10 mb-2 border-b border-zinc-100 last:border-b-0 font-figtree">
      <div className="mb-8">
        <h2 className="text-[13px] font-semibold tracking-[0.25em] uppercase text-zinc-900 pb-3 border-b border-zinc-900 inline-block">
          {url ? (
            <Link href={url} className="hover:opacity-60 transition-opacity">
              {section}
            </Link>
          ) : (
            section
          )}
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-8">
        {columns.map((col, idx) => (
          <SitemapColumn key={`${col.title}-${idx}`} title={col.title} links={col.links} />
        ))}
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default async function SitemapPage() {
  const client = await clientPromise;
  const db = client.db();
  const sitemapData = await db.collection("sitemaps").findOne({ type: "main" });

  if (!sitemapData) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Sitemap data not found. Please sync it from the dashboard.</p>
      </div>
    );
  }

  const { collections = [], pages = [], articles = [], products = [] } = sitemapData;

  // Transform data into sections
  const splitIntoColumns = (items, type, perColumn = 15) => {
    const columns = [];
    for (let i = 0; i < items.length; i += perColumn) {
      columns.push({
        title: "",
        links: items.slice(i, i + perColumn).map(item => ({
          label: item.title,
          href: item.handle.startsWith("/") ? item.handle : 
                (type === "Collection" ? `/collections/${item.handle}` :
                 type === "Page" ? `/pages/${item.handle}` :
                 type === "Article" ? `/blogs/stories/${item.handle}` :
                 `/products/${item.handle}`)
        }))
      });
    }
    return columns;
  };

  const dynamicSections = [
    {
      section: "COLLECTIONS",
      url: "/collections",
      columns: splitIntoColumns(collections, "Collection", 20)
    },
    {
      section: "PAGES",
      url: null,
      columns: splitIntoColumns(pages, "Page", 25)
    },
    {
      section: "STORIES",
      url: "/blogs/stories",
      columns: splitIntoColumns(articles, "Article", 15)
    },
    {
      section: "PRODUCTS",
      url: "/collections/all",
      columns: splitIntoColumns(products, "Product", 30)
    }
  ];

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Header */}
      <section className="border-b border-zinc-200 py-12 px-4 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 mb-2">
          Lucira Jewelry
        </p>
        <h1 className="text-[22px] sm:text-[28px] font-light tracking-[0.4em] uppercase text-zinc-900">
          Sitemap
        </h1>
      </section>

      {/* Sections */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16 py-14 space-y-12">
        {/* Dynamic Sections first as requested */}
        {dynamicSections.map((item) => (
          <SitemapSection
            key={item.section}
            section={item.section}
            url={item.url}
            columns={item.columns}
          />
        ))}

        {/* Manual Sections */}
        {MANUAL_SITEMAP_DATA.map((item) => (
          <SitemapSection
            key={item.section}
            section={item.section}
            url={item.url}
            columns={item.columns}
          />
        ))}
      </div>
    </div>
  );
}