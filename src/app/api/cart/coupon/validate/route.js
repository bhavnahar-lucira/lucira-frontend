import { NextResponse } from "next/server";
import { shopifyAdminFetch } from "@/lib/shopify";
import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  try {
    const { items, couponCode, customerEmail } = await req.json();

    if (!couponCode) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const discountData = await shopifyAdminFetch(`
      query getDiscount($code: String!) {
        codeDiscountNodeByCode(code: $code) {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              status
              summary
              shortSummary
              customerGets {
                value {
                  ... on DiscountAmount {
                    amount { amount }
                  }
                  ... on DiscountPercentage {
                    percentage
                  }
                }
                items {
                  ... on AllDiscountItems { allItems }
                  ... on DiscountProducts {
                    products(first: 100) { nodes { id } }
                  }
                  ... on DiscountCollections {
                    collections(first: 100) { nodes { id } }
                  }
                }
              }
            }
          }
        }
      }
    `, { code: couponCode });

    const discountNode = discountData?.codeDiscountNodeByCode;

    if (!discountNode || discountNode.codeDiscount.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 400 });
    }

    const discountInfo = discountNode.codeDiscount;
    let value = 0;
    let valueType = "FIXED_AMOUNT";

    if (discountInfo.customerGets?.value?.amount) {
      value = Number(discountInfo.customerGets.value.amount.amount);
      valueType = "FIXED_AMOUNT";
    } else if (discountInfo.customerGets?.value?.percentage) {
      value = Number(discountInfo.customerGets.value.percentage) * 100;
      valueType = "PERCENTAGE";
    }

    const entitledItems = discountInfo.customerGets?.items;
    
    if (entitledItems && !entitledItems.allItems) {
      const client = await clientPromise;
      const db = client.db("next_local_db"); // Updated to the correct DB containing products
      const productsCollection = db.collection("products");

      const entitledProductIds = entitledItems.products?.nodes?.map(p => p.id) || [];
      const entitledCollectionIds = entitledItems.collections?.nodes?.map(c => c.id) || [];

      console.log("DEBUG [Coupon]: Entitled Product IDs:", entitledProductIds);
      console.log("DEBUG [Coupon]: Entitled Collection IDs:", entitledCollectionIds);

      // Get product details for items in cart to check their IDs and collections/tags
      const cartProductIds = items.map(item => {
        const id = item.shopifyId || item.productId || item.id;
        const normalizedId = (id && id.toString().includes("gid://")) ? id : `gid://shopify/Product/${id}`;
        return normalizedId;
      }).filter(Boolean);
      
      console.log("DEBUG [Coupon]: Normalized Cart Product GIDs:", cartProductIds);

      const dbProducts = await productsCollection.find({ 
        shopifyId: { $in: cartProductIds } 
      }).project({ shopifyId: 1, collectionHandles: 1, tags: 1 }).toArray();

      console.log("DEBUG [Coupon]: Found DB Products:", dbProducts.length);

      let entitledCollectionHandles = [];
      if (entitledCollectionIds.length > 0) {
        const uniqueCollIds = [...new Set(entitledCollectionIds)];
        const CHUNK_SIZE = 100;
        const collNodes = [];

        for (let i = 0; i < uniqueCollIds.length; i += CHUNK_SIZE) {
          const chunk = uniqueCollIds.slice(i, i + CHUNK_SIZE);
          const collectionsData = await shopifyAdminFetch(`
            query getCollections($ids: [ID!]!) {
              nodes(ids: $ids) {
                ... on Collection {
                  id
                  handle
                  title
                }
              }
            }
          `, { ids: chunk });
          if (collectionsData?.nodes) {
            collNodes.push(...collectionsData.nodes);
          }
        }
        
        entitledCollectionHandles = collNodes.map(n => n.handle).filter(Boolean) || [];
        const entitledCollectionTitles = collNodes.map(n => n.title).filter(Boolean) || [];
        
        console.log("DEBUG [Coupon]: Entitled Collection Handles:", entitledCollectionHandles);
        console.log("DEBUG [Coupon]: Entitled Collection Titles:", entitledCollectionTitles);

        const applicableItems = items.filter(item => {
          const rawId = item.shopifyId || item.productId || item.id;
          let productGid = (rawId && rawId.toString().includes("gid://")) ? rawId : `gid://shopify/Product/${rawId}`;
          
          const dbProduct = dbProducts.find(p => p.shopifyId === productGid);
          
          // 1. Check if product is explicitly entitled
          const isProductEntitled = entitledProductIds.includes(productGid);
          
          // 2. Check if any of product's collections are entitled (via handles)
          const isCollectionEntitled = dbProduct && dbProduct.collectionHandles && entitledCollectionHandles.length > 0 
            ? dbProduct.collectionHandles.some(h => entitledCollectionHandles.includes(h))
            : false;

          // 3. Fallback: Check if any of product's tags match entitled collection titles
          // This is useful because our DB often stores collection info in tags
          const isTagEntitled = dbProduct && dbProduct.tags && entitledCollectionTitles.length > 0
            ? dbProduct.tags.some(tag => entitledCollectionTitles.some(title => tag.toLowerCase().includes(title.toLowerCase())))
            : false;

          console.log(`DEBUG [Coupon]: Testing Item ${productGid} - Product: ${isProductEntitled}, Collection: ${isCollectionEntitled}, Tag: ${isTagEntitled}`);

          return isProductEntitled || isCollectionEntitled || isTagEntitled;
        });

        console.log("DEBUG [Coupon]: Applicable Items Count:", applicableItems.length);

        if (applicableItems.length === 0) {
          return NextResponse.json({ 
            error: "This coupon is not applicable to the items in your cart." 
          }, { status: 400 });
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      code: couponCode,
      summary: discountInfo.summary || discountInfo.shortSummary || "Coupon applied successfully",
      value,
      valueType
    });

  } catch (error) {
    console.error("COUPON VALIDATION ERROR:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
