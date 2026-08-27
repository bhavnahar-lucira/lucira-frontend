"use client";

import { OFFER_CATEGORY } from "@/lib/coupons";


/**
 * Presentation for the metal-split offers ("Additional 5% OFF on Diamond
 * Products", "Additional 2% OFF on Plain Gold Products"). The banner above
 * Apply Coupon and the special cards inside the Saving Zone drawer both
 * render the same offer, so the palette and the icon live here once —
 * otherwise the two surfaces drift the moment either is touched.
 *
 * Both palettes stay on the cart's warm cream base; the metal reads through
 * the icon tile, the accent on the discount figure, and the category pill,
 * not through a wholesale colour change that would fight the rest of the page.
 */
export const OFFER_THEME = {
  [OFFER_CATEGORY.DIAMOND]: {
    label: "Diamond",
    background: "linear-gradient(89.31deg, rgb(253, 252, 255) 0%, rgb(232, 237, 246) 100%)",
    border: "#DDE2EF",
    tileBg: "linear-gradient(160deg, #FFFFFF 0%, #E9EFFA 100%)",
    tileBorder: "#D3DBEC",
    accent: "#3F5578",
    tileSolid: "#EDF3FF",
    flatBg: "#F3F7FF",
    pillBg: "#EEF2FB",
    pillText: "#43567A",
  },
  [OFFER_CATEGORY.GOLD]: {
    label: "Plain Gold",
    background: "linear-gradient(89.31deg, rgb(255, 252, 243) 0%, rgb(243, 228, 196) 100%)",
    border: "#E8D9B6",
    tileBg: "linear-gradient(160deg, #FFFDF7 0%, #F7EACF 100%)",
    tileBorder: "#E5D3AB",
    accent: "#8A6A28",
    tileSolid: "#FFFBDA",
    flatBg: "#FFFCEC",
    pillBg: "#FBF1DB",
    pillText: "#7C5F22",
  },
  [OFFER_CATEGORY.ALL]: {
    label: "Offer",
    background: "linear-gradient(89.31deg, rgb(254, 245, 241) 0%, rgb(241, 228, 209) 100%)",
    border: "#EADFD8",
    tileBg: "#FEF9F6",
    tileBorder: "#EADFD8",
    accent: "#5A413F",
    tileSolid: "#FEF9F6",
    flatBg: "#FEF9F6",
    pillBg: "#FBEFE9",
    pillText: "#5A413F",
  },
};

export const getOfferTheme = (category) => OFFER_THEME[category] || OFFER_THEME[OFFER_CATEGORY.ALL];

/**
 * Brilliant-cut diamond for diamond offers, a stack of bullion for plain
 * gold, and the generic discount rosette for anything uncategorised — so a
 * customer can tell which half of the cart an offer covers before reading a
 * word of it.
 */
export default function OfferCategoryIcon({ category, className = "", color }) {
  const stroke = color || getOfferTheme(category).accent;

  if (category === OFFER_CATEGORY.DIAMOND) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
        <path
          d="M6.2 3h11.6L22 9.1 12 21.2 2 9.1 6.2 3Z"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M2 9.1h20M6.2 3l2.4 6.1M17.8 3l-2.4 6.1M8.6 9.1 12 21.2l3.4-12.1" stroke={stroke} strokeWidth="1.3" strokeLinejoin="round" opacity="0.75" />
      </svg>
    );
  }

  if (category === OFFER_CATEGORY.GOLD) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
        <path d="M9.9 3.6h4.2l1.5 4.2H8.4l1.5-4.2Z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M6.6 9.7h4.2l1.5 4.2H5.1l1.5-4.2ZM13.2 9.7h4.2l1.5 4.2h-7.2l1.5-4.2Z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M3.3 15.8h4.2l1.5 4.2H1.8l1.5-4.2ZM9.9 15.8h4.2l1.5 4.2H8.4l1.5-4.2ZM16.5 15.8h4.2l1.5 4.2h-7.2l1.5-4.2Z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" opacity="0.9" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M24.9998 15L14.9998 25M14.9998 15H15.0165M24.9998 25H25.0165M6.4165 14.3667C6.17323 13.2709 6.21059 12.1314 6.52509 11.0539C6.8396 9.97639 7.42108 8.99574 8.21561 8.20287C9.01015 7.41 9.99202 6.83057 11.0702 6.51832C12.1483 6.20607 13.2879 6.17111 14.3832 6.41667C14.986 5.47384 15.8165 4.69793 16.7981 4.16048C17.7797 3.62302 18.8807 3.34131 19.9998 3.34131C21.1189 3.34131 22.22 3.62302 23.2016 4.16048C24.1832 4.69793 25.0137 5.47384 25.6165 6.41667C26.7134 6.17004 27.8549 6.20485 28.9348 6.51786C30.0147 6.83086 30.9979 7.4119 31.7929 8.20692C32.5879 9.00194 33.169 9.98512 33.482 11.065C33.795 12.1449 33.8298 13.2864 33.5832 14.3833C34.526 14.9862 35.3019 15.8167 35.8394 16.7983C36.3768 17.7798 36.6585 18.8809 36.6585 20C36.6585 21.1191 36.3768 22.2202 35.8394 23.2017C35.3019 24.1833 34.526 25.0138 33.5832 25.6167C33.8287 26.7119 33.7938 27.8515 33.4815 28.9297C33.1693 30.0078 32.5898 30.9897 31.797 31.7842C31.0041 32.5788 30.0234 33.1602 28.9459 33.4747C27.8684 33.7892 26.729 33.8266 25.6332 33.5833C25.0311 34.5298 24.2 35.309 23.2167 35.8489C22.2335 36.3887 21.1299 36.6718 20.0082 36.6718C18.8865 36.6718 17.7829 36.3887 16.7996 35.8489C15.8164 35.309 14.9852 34.5298 14.3832 33.5833C13.2879 33.8289 12.1483 33.7939 11.0702 33.4817C9.99202 33.1694 9.01015 32.59 8.21561 31.7971C7.42108 31.0043 6.8396 30.0236 6.52509 28.9461C6.21059 27.8686 6.17323 26.7291 6.4165 25.6333C5.46643 25.0321 4.68386 24.2003 4.14158 23.2154C3.5993 22.2304 3.31494 21.1243 3.31494 20C3.31494 18.8757 3.5993 17.7696 4.14158 16.7846C4.68386 15.7997 5.46643 14.9679 6.4165 14.3667Z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
