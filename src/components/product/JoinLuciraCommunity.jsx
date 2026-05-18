"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LazyImage from "../common/LazyImage";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { pushNewsletterSubscription } from "@/lib/gtm";

export function JoinLuciraCommunity() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    if (e) e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // GTM tracking
        pushNewsletterSubscription(email);

        toast.success(data.message || "Successfully subscribed to our newsletter!");
        setEmail("");
      } else {
        toast.error(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full bg-[#FEF5F1] overflow-hidden mt-0">
      <div className="max-w-480 mx-auto grid lg:grid-cols-2 items-stretch">

        {/* Mobile: Top Content | Desktop: Left Side (Images) */}
        {!isMobile && (
          <div className="flex h-full min-h-[400px]">
            <div className="w-1/2 relative">
              <LazyImage
                src="/images/subscribe-2.jpg"
                alt="Community 1"
                fill
                className="object-cover"
              />
            </div>
            <div className="w-1/2 relative">
              <LazyImage
                src="/images/subscribe-1.jpg"
                alt="Community 2"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Content Side */}
        <div className="flex flex-col justify-center py-6 px-10">
          <div className="w-full space-y-6">
            <div className="text-left mb-6">
              <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">Join the Lucira Community Today</h2>
              <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">Get early access to jewelry drops, care tips, and exclusive offers, straight to your inbox.</p>
            </div>

            <div className="space-y-4">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-14 bg-white/50 border-primary rounded-sm px-6 text-base placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-900"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 w-full md:w-fit px-12 bg-primary hover:accent text-white font-bold text-base uppercase rounded-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </form>
              <p className="text-xs text-black">
                You can unsubscribe anytime. For more details read our{" "}
                <a href="/pages/privacy-policy" className="underline font-bold text-zinc-900 hover:text-black transition-colors">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Mobile: Bottom Images */}
        {isMobile && (
          <div className="flex h-64 w-full">
            <div className="w-1/2 relative">
              <LazyImage
                src="/images/subscribe-2.jpg"
                alt="Community 1"
                fill
                className="object-cover"
              />
            </div>
            <div className="w-1/2 relative">
              <LazyImage
                src="/images/subscribe-1.jpg"
                alt="Community 2"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Desktop: Right Content is handled by the "Content Side" div above in the grid */}
      </div>
    </section>
  );
}
