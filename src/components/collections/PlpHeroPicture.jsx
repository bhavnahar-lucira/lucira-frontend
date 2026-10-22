"use client";

import { getImageProps } from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";

// Matches the `lg` breakpoint used by `hidden lg:block` / `lg:hidden` and by
// useMediaQuery("(max-width: 1023px)") in the collection page.
const DESKTOP_MEDIA = "(min-width: 1024px)";
const MOBILE_MEDIA = "(max-width: 1023px)";

/**
 * Collection hero image that downloads ONE file per device.
 *
 * Before: a desktop <Image priority> inside `hidden lg:block` and a mobile
 * <Image priority> inside `lg:hidden`. `priority` preloads both and a hidden
 * <img> still downloads, so every phone fetched the desktop banner and every
 * desktop fetched the mobile one.
 *
 * Now: a single <picture> whose <source media> picks the desktop file at the
 * lg breakpoint and the mobile file below it. The browser requests only the
 * matching source. When `preload` is set, two media-scoped
 * <link rel="preload"> hints (React hoists them into <head>) start that one
 * download at parse time, each limited to its own breakpoint.
 *
 * Both srcsets come from next/image's getImageProps with the Shopify loader,
 * so the URLs are exactly what <Image loader={shopifyLoader}> produced before.
 */
export default function PlpHeroPicture({
  desktop, // { src, width, height }
  mobile, // { src, width, height }
  alt,
  className = "",
  preload = false,
  draggable,
}) {
  const common = { alt, sizes: "100vw", loader: shopifyLoader, priority: true };
  const { props: desktopProps } = getImageProps({ ...common, ...desktop });
  const { props: mobileProps } = getImageProps({ ...common, ...mobile });

  // getImageProps returns the attributes next/image would render; `priority`
  // gives us fetchPriority="high" + loading="eager" without a preload.
  const { srcSet: desktopSrcSet, sizes: desktopSizes } = desktopProps;
  const { srcSet: mobileSrcSet, sizes: mobileSizes, ...imgProps } = mobileProps;

  return (
    <>
      {preload && (
        <>
          <link
            rel="preload"
            as="image"
            media={DESKTOP_MEDIA}
            imageSrcSet={desktopSrcSet}
            imageSizes={desktopSizes}
            fetchPriority="high"
          />
          <link
            rel="preload"
            as="image"
            media={MOBILE_MEDIA}
            imageSrcSet={mobileSrcSet}
            imageSizes={mobileSizes}
            fetchPriority="high"
          />
        </>
      )}
      <picture>
        <source media={DESKTOP_MEDIA} srcSet={desktopSrcSet} sizes={desktopSizes} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...imgProps}
          srcSet={mobileSrcSet}
          sizes={mobileSizes}
          alt={alt}
          className={className}
          draggable={draggable}
          fetchPriority="high"
          loading="eager"
        />
      </picture>
    </>
  );
}
