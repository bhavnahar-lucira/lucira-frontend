import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { shopifyStorefrontFetch, shopifyAdminRestFetch } from "@/lib/shopify";

async function getCustomerAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("customerAccessToken")?.value || "";
}

async function getCustomerId(customerAccessToken) {
  const data = await shopifyStorefrontFetch(`
    query($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
      }
    }
  `, { customerAccessToken });
  return data?.customer?.id;
}

export async function GET() {
  try {
    const customerAccessToken = await getCustomerAccessToken();
    if (!customerAccessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = await getCustomerId(customerAccessToken);
    if (!customerId) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Fetch orders using Shopify Admin REST API
    const numericCustomerId = customerId.split('/').pop();
    const { data } = await shopifyAdminRestFetch('orders.json', {
      customer_id: numericCustomerId,
      status: 'any',
      limit: 20
    });

    const ordersRaw = data.orders || [];

    // Find representative items
    const representativeItems = ordersRaw.map(order => {
      // Sort items by price descending, push insurance to the end
      const sortedItems = [...(order.line_items || [])].sort((a, b) => {
        const aIsInsurance = a.name.toLowerCase().includes('insurance');
        const bIsInsurance = b.name.toLowerCase().includes('insurance');
        if (aIsInsurance && !bIsInsurance) return 1;
        if (!aIsInsurance && bIsInsurance) return -1;
        return parseFloat(b.price || 0) - parseFloat(a.price || 0);
      });
      return sortedItems[0];
    });

    // Fetch product images for representative items
    const productIds = [...new Set(representativeItems.map(item => item?.product_id).filter(id => id))];
    let productImages = {};
    if (productIds.length > 0) {
      try {
        const { data: productsData } = await shopifyAdminRestFetch('products.json', {
          ids: productIds.join(',')
        });
        (productsData.products || []).forEach(p => {
          productImages[p.id] = p.image?.src;
        });
      } catch (e) {
        console.error("Failed to fetch product images", e);
      }
    }

    const orders = ordersRaw.map((order, index) => {
      const repItem = representativeItems[index];
      return {
        id: order.admin_graphql_api_id,
        orderNumber: order.order_number.toString(),
        customerEmail: order.customer?.email || "",
        date: new Date(order.processed_at).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        status: order.fulfillment_status === 'fulfilled' ? 'Delivered' : 
                order.fulfillment_status === 'partial' ? 'In Transit' : 'Processing',
        amount: new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: order.currency,
        }).format(order.total_price),
        product: repItem?.name || "Jewelry Item",
        image: (repItem?.product_id && productImages[repItem.product_id]) ? productImages[repItem.product_id] : "/images/product/1.jpg"
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin REST API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
