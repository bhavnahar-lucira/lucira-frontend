"use client";

import { useEffect } from "react";

const sections = [
  {
    id: "bannerSection",
    heading: "Ideation & Sketching",
    title: "Ideation & sketching",
    className: "craftmanship-banner",
    wrapperClass: "craftmanship-banner-wrapper",
    contentId: "bannerContent",
    zIndex: 9,
    desktopImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Sketch_1.jpg?v=1760704290",
    mobileImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Sketch_2.jpg?v=1761630096"
  },
  {
    id: "bannerSection2",
    heading: "3d Designing",
    title: "3d Designing",
    className: "craftmanship-3d-design-banner",
    wrapperClass: "craftmanship-3d-design-banner-wrapper",
    contentId: "bannerContent2",
    zIndex: 8,
    desktopImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/CAD_1.jpg?v=1760704290",
    mobileImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/3D.jpg?v=1761630096"
  },
  {
    id: "bannerSection3",
    heading: "Molding & Casting",
    title: "Molding & Casting",
    className: "craftmanship-molding-casting-banner",
    wrapperClass: "craftmanship-molding-casting-wrapper",
    contentId: "bannerContent3",
    zIndex: 7,
    desktopImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Molding_Casting_1.png?v=1751633860",
    mobileImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Molding_Casting_Mob_1.png?v=1751635669"
  },
  {
    id: "bannerSection5",
    heading: "Quality Check",
    title: "Filing & Polishing",
    className: "craftmanship-polishing-banner",
    wrapperClass: "craftmanship-polishing-banner-wrapper",
    contentId: "bannerContent5",
    zIndex: 6,
    desktopImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Polishing_Coating_1.png?v=1751634033",
    mobileImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Polishing_Coating_Mob_1.png?v=1751635404"
  },
  {
    id: "bannerSection6",
    heading: "Metal Setting",
    title: "Diamond Setting",
    className: "craftmanship-metal-setting-banner",
    wrapperClass: "craftmanship-metal-setting-banner-wrapper",
    contentId: "bannerContent6",
    zIndex: 5,
    desktopImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Diamond-Setting_1.jpg?v=1760704290",
    mobileImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Diamond-Setting_2.jpg?v=1761630096"
  },
  {
    id: "bannerSection7",
    heading: null,
    title: "Quality Check",
    className: "craftmanship-quality-check-banner",
    wrapperClass: "craftmanship-quality-check-banner-wrapper",
    contentId: "bannerContent7",
    zIndex: 4,
    desktopImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/QC_1.jpg?v=1760704290",
    mobileImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/QC_2.jpg?v=1761630096"
  },
  {
    id: "bannerSection8",
    heading: "Packaging",
    title: "Packaging",
    className: "craftmanship-packaging-banner",
    wrapperClass: "craftmanship-packaging-banner-wrapper",
    contentId: "bannerContent2",
    zIndex: 3,
    desktopImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Packaging_1.png?v=1751634963",
    mobileImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Packaging_Mob_1.png?v=1751635669"
  }
];

export default function CraftmanshipPage() {
  return (
    <main className="page-craftmanship-template-page font-figtree">
      <style>{`
        .page-craftmanship-template-page .section-header.shopify-section-group-header-group { z-index: 21; }
        .page-craftmanship-template-page summary.list-menu__item { color: white; }
        .page-craftmanship-template-page .header-wrapper.color-scheme-1.gradient.header-wrapper--border-bottom:hover summary.list-menu__item { color: #000000; }
        .page-craftmanship-template-page .header-wrapper.color-scheme-1.gradient.header-wrapper--border-bottom:hover {background: #fff;}

        .craftmanship-banner,
        .craftmanship-3d-design-banner,
        .craftmanship-molding-casting-banner,
        .craftmanship-grinding-filing-banner,
        .craftmanship-polishing-banner,
        .craftmanship-quality-check-banner,
        .craftmanship-metal-setting-banner,
        .craftmanship-packaging-banner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          overflow: hidden;
          background-attachment: fixed;
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
        }

        ${sections.map(s => `
          .${s.className} {
            background-image: url(${s.desktopImage});
            -webkit-mask-image: url(${s.desktopImage});
            -webkit-mask-size: cover;
            -webkit-mask-repeat: no-repeat;
            -webkit-mask-position: center;
            z-index: ${s.zIndex};
          }
        `).join('\n')}

        .craftmanship-banner::before,
        .craftmanship-3d-design-banner::before,
        .craftmanship-molding-casting-banner::before,
        .craftmanship-grinding-filing-banner::before,
        .craftmanship-metal-setting-banner::before,
        .craftmanship-polishing-banner::before,
        .craftmanship-quality-check-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0);
          z-index: 1;
        }

        .craftmanship-banner h2,
        .craftmanship-3d-design-banner h2,
        .craftmanship-molding-casting-banner h2,
        .craftmanship-grinding-filing-banner h2,
        .craftmanship-polishing-banner h2,
        .craftmanship-quality-check-banner h2,
        .craftmanship-metal-setting-banner h2,
        .craftmanship-packaging-banner h2 {
          font-weight: 600;
          font-size: 38px;
          line-height: 100%;
          letter-spacing: 0%;
          vertical-align: middle;
          margin-bottom: 8px;
          color: #fff;
          text-transform: uppercase;
          font-family: Figtree, sans-serif;
          opacity: 1;
          transform: translateY(0);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 3;
        }

        .craftmanship-banner-wrapper,
        .craftmanship-3d-design-banner-wrapper,
        .craftmanship-molding-casting-wrapper,
        .craftmanship-grinding-filing-wrapper,
        .craftmanship-polishing-banner-wrapper,
        .craftmanship-quality-check-banner-wrapper,
        .craftmanship-metal-setting-banner-wrapper,
        .craftmanship-packaging-banner-wrapper {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) perspective(1000px) translateZ(100px);
          z-index: 2;
          text-align: center;
          width: 100%;
          padding: 0 20px;
          pointer-events: none;
          opacity: 1;
        }

        @media only screen and (max-width: 767px) {
          .craftmanship-banner-wrapper h2,
          .craftmanship-3d-design-banner-wrapper h2,
          .craftmanship-molding-casting-wrapper h2,
          .craftmanship-grinding-filing-wrapper h2,
          .craftmanship-polishing-banner-wrapper h2,
          .craftmanship-quality-check-banner-wrapper h2,
          .craftmanship-packaging-banner-wrapper h2,
          .craftmanship-metal-setting-banner-wrapper h2{
            font-size: 20px !important;
            letter-spacing: 2px;
            max-width: 330px;
          }

          .page-craftmanship-template-page .header-wrapper.color-scheme-1.gradient.header-wrapper--border-bottom {
            background: #ffffff;
          }

          .page-craftmanship-template-page .hulkapps-wl-wishlist-icon .icon-wishlist-heart-empty {
            color: #000000 !important;
          }

          ${sections.map(s => `
            .${s.className} {
              background-image: url(${s.mobileImage});
              -webkit-mask-image: url(${s.mobileImage});
              -webkit-mask-size: cover;
              -webkit-mask-repeat: no-repeat;
              -webkit-mask-position: center;
            }
          `).join('\n')}
        }
      `}</style>

      <h1 style={{ display: "none" }}>Craftmanship</h1>

      {sections.map((section) => (
        <section
          key={section.id}
          className={section.className}
          id={section.id}
          data-heading={section.heading}
        >
          <div className="page-width">
            <div className={section.wrapperClass} id={section.contentId}>
              <h2>{section.title}</h2>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}