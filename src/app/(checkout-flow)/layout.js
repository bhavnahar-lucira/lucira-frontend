"use client";

import CheckoutHeader from "@/components/common/CheckoutHeader";
import CheckoutFooter from "@/components/common/CheckoutFooter";
import { useCart } from "@/hooks/useCart";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart } from "@/redux/features/cart/cartSlice";

export default function CheckoutLayout({ children }) {
  const { items, loading } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  const isCompletionPage = pathname.includes("/success") || pathname.includes("/failure");

  useEffect(() => {
    // Only guard specific checkout steps
    const isProtectedStep = pathname === "/checkout/shipping" || pathname === "/checkout/payment";
    
    if (!loading && isProtectedStep && !isCompletionPage && items.length === 0) {
      router.replace("/checkout/cart");
    } else {
      setIsVerifying(false);
    }
  }, [items, loading, pathname, router, isCompletionPage]);

  // Make sure we fetch the latest cart on checkout flow mount
  // Otherwise refreshing the cart page will just show stale localStorage data
  const dispatch = useDispatch();
  const user = useSelector(state => state.user?.user);
  useEffect(() => {
    dispatch(fetchCart({ userId: user?.id }));
  }, [dispatch, user?.id]);

  // Show nothing while verifying to prevent layout flash of protected pages
  const needsVerification = pathname === "/checkout/shipping" || pathname === "/checkout/payment";
  if (isVerifying && needsVerification) {
    return <div className="min-h-screen bg-white" />;
  }

  // Success and Failure pages should not show the checkout header/footer
  if (isCompletionPage) {
    return <main>{children}</main>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CheckoutHeader />
      <main className="flex-grow">
        {children}
      </main>
      <div className="bg-[#F9F9FB]">
        <CheckoutFooter />
      </div>
    </div>
  );
}
