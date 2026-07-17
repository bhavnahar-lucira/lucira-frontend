"use client";

import SocialProofBand from "@/components/common/SocialProofBand";

// Product-page FOMO band. Rotation, icons, colours and labels live in the shared
// band ("@/components/common/SocialProofBand") so the checkout cart stays in sync.
export default function ProductSocialProofBand({ socialProof, className = "" }) {
  return <SocialProofBand socialProof={socialProof} variant="product" className={className} />;
}
