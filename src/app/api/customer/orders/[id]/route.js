import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { shopifyStorefrontFetch, shopifyAdminRestFetch } from "@/lib/shopify";

async function getCustomerAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("customerAccessToken")?.value || "";
}

async function getCustomerData(customerAccessToken) {
  const data = await shopifyStorefrontFetch(`
    query($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        defaultAddress {
          address1
          address2
          city
          company
          country
          firstName
          lastName
          phone
          province
          zip
        }
      }
    }
  `, { customerAccessToken });
  return data?.customer;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const customerAccessToken = await getCustomerAccessToken();
    if (!customerAccessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await getCustomerData(customerAccessToken);
    if (!customer?.id) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Format ID for REST API (ensure it's numeric)
    const numericOrderId = id.includes('/') ? id.split('/').pop() : id;

    // Fetch single order using REST API
    const { data: orderData } = await shopifyAdminRestFetch(`orders/${numericOrderId}.json`);
    const restOrder = orderData.order;

    if (!restOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security check: Ensure the order belongs to the authenticated customer
    const numericCustomerId = customer.id.split('/').pop();
    if (restOrder.customer.id.toString() !== numericCustomerId.toString()) {
      return NextResponse.json({ error: "Unauthorized access to order" }, { status: 403 });
    }

    // Optional: Fetch product images since REST orders don't include them
    const productIds = [...new Set(restOrder.line_items.map(li => li.product_id).filter(id => id))];
    let productImages = {};
    
    if (productIds.length > 0) {
      try {
        const { data: productsData } = await shopifyAdminRestFetch('products.json', { 
          ids: productIds.join(',') 
        });
        (productsData.products || []).forEach(p => {
          productImages[p.id] = {
            image: p.image?.src,
            handle: p.handle
          };
        });
      } catch (e) {
        console.error("Failed to fetch product images for order details", e);
      }
    }

    const order = {
      id: restOrder.admin_graphql_api_id,
      orderNumber: restOrder.order_number.toString(),
      customerEmail: restOrder.customer?.email || "",
      processedAt: restOrder.processed_at,
      financialStatus: restOrder.financial_status.toUpperCase(),
      fulfillmentStatus: (restOrder.fulfillment_status || 'unfulfilled').toUpperCase(),
      totalPrice: {
        amount: restOrder.total_price,
        currencyCode: restOrder.currency
      },
      totalTax: {
        amount: restOrder.total_tax,
        currencyCode: restOrder.currency
      },
      subtotalPrice: {
        amount: restOrder.subtotal_price,
        currencyCode: restOrder.currency
      },
      totalShippingPrice: {
        amount: restOrder.total_shipping_price_set?.shop_money?.amount || "0.00",
        currencyCode: restOrder.currency
      },
      shippingAddress: restOrder.shipping_address || customer.defaultAddress,
      isDefaultFallback: !restOrder.shipping_address && !!customer.defaultAddress,
      lineItems: restOrder.line_items.map((li) => {
        const prodData = productImages[li.product_id] || {};
        return {
          title: li.name,
          quantity: li.quantity,
          price: {
            amount: li.price,
            currencyCode: restOrder.currency
          },
          image: prodData.image || "/images/product/1.jpg",
          handle: prodData.handle || ""
        };
      }).sort((a, b) => {
        const aIsInsurance = a.title.toLowerCase().includes('insurance');
        const bIsInsurance = b.title.toLowerCase().includes('insurance');
        if (aIsInsurance && !bIsInsurance) return 1;
        if (!aIsInsurance && bIsInsurance) return -1;
        return parseFloat(b.price.amount || 0) - parseFloat(a.price.amount || 0);
      })
    };

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Admin REST API Order Detail Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
