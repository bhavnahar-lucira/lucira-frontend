// Gallery media helpers shared by ProductGallery (client) and the server
// product page, which preloads the first image this ordering produces. The
// ordering logic was moved here verbatim from ProductGallery.jsx so the two can
// never disagree about which image is the hero.

export function formatCdnUrl(url) {
  if (!url || typeof url !== 'string') return url;
  return url.replace("https://www.lucirajewelry.com", "https://luciraonline.myshopify.com").replace("http://www.lucirajewelry.com", "https://luciraonline.myshopify.com");
}

/** `sizes` for the hero image: full width on mobile, the gallery column on desktop. */
export const HERO_IMAGE_SIZES = "(max-width: 1023px) 100vw, 50vw";

/**
 * Order the product media for display given the active colour / variant.
 * Returns a new array; the first entry is the hero image.
 */
export function sortGalleryMedia(media, activeColor, activeVariant) {
    if (!media || media.length === 0) return [];

    const COLOR_TOKENS = ["white", "yellow", "rose", "plt", "platinum"];
    const ALWAYS_SHOW_CODES = ["mv-ai", "mv_ai", "mv", "mq-ai", "mq_ai", "mq", "mh-ai", "mh_ai", "mh", "ci-ai", "ci_ai", "ci", "360v", "360°"];

    const formattedMedia = media
      .filter(m => {
        const altText = m.alt || m.altText || m.previewImage?.altText || "";
        return altText.trim().length > 0;
      })
      .map(m => {
        const newM = { ...m };
        if (newM.url) newM.url = formatCdnUrl(newM.url);
        if (newM.preview) newM.preview = formatCdnUrl(newM.preview);
        if (newM.previewImage?.url) {
          newM.previewImage = { ...newM.previewImage, url: formatCdnUrl(newM.previewImage.url) };
        }
        if (newM.sources) {
          newM.sources = newM.sources.map(s => ({ ...s, url: formatCdnUrl(s.url) }));
        }
        return newM;
      });

    const getColorFromAlt = (text) => {
      const lower = (text || "").toLowerCase();
      if (lower.includes("white") && lower.includes("yellow")) return "white-yellow";
      if (lower.includes("white") && lower.includes("rose")) return "white-rose";

      const match = lower.match(/(yellow|white|rose|plt|platinum)[\s-]?(yellow|white|rose|plt|platinum)?/);
      if (match && match[1]) {
        const firstColor = match[1];
        if (firstColor === "platinum") return "plt";
        return firstColor;
      }
      return "";
    };

    const isColorMatch = (itemColor, target) => {
      if (!itemColor || !target) return false;
      if (itemColor === target) return true;
      if (target === "white-yellow" && itemColor === "yellow") return true;
      if (target === "white-rose" && itemColor === "rose") return true;
      return false;
    };

    const targetColor = getColorFromAlt(activeColor) || (String(activeColor || "").toLowerCase().includes("plt") ? "plt" : String(activeColor || "").toLowerCase());

    const buckets = {
      color: [],
      codes: { "mv-ai": [], mv: [], "mq-ai": [], mq: [], "mh-ai": [], mh: [], "ci-ai": [], ci: [], v360: [] },
      cert: [],
      extras: []
    };

    formattedMedia.forEach(item => {
      const alt = (item.alt || "").toLowerCase();
      const urlString = (item.url || item.sources?.[0]?.url || item.preview || item.previewImage?.url || "").toLowerCase();
      const itemColor = getColorFromAlt(alt);
      const isAnyColor = COLOR_TOKENS.some(c => alt.includes(c));

      if (alt.includes("cert")) {
        buckets.cert.push(item);
        return;
      }

      const isCodeMatch =
        ALWAYS_SHOW_CODES.some(code => alt.includes(code)) ||
        (alt.includes("mv") && (urlString.includes("mv_ai") || urlString.includes("mv-ai")));
      
      if (isColorMatch(itemColor, targetColor) || (!isAnyColor && isCodeMatch)) {
        if (
          alt.includes("mv-ai") ||
          alt.includes("mv_ai") ||
          alt.includes("mv ai") ||
          (alt.includes("mv") && (urlString.includes("mv_ai") || urlString.includes("mv-ai")))
        ) {
          buckets.codes["mv-ai"].push(item);
        } else if (alt.includes("mv")) {
          buckets.codes.mv.push(item);
        } else if (alt.includes("mq-ai") || alt.includes("mq_ai") || alt.includes("mq ai")) {
          buckets.codes["mq-ai"].push(item);
        } else if (alt.includes("mq")) {
          buckets.codes.mq.push(item);
        } else if (alt.includes("mh-ai") || alt.includes("mh_ai") || alt.includes("mh ai")) {
          buckets.codes["mh-ai"].push(item);
        } else if (alt.includes("mh")) {
          buckets.codes.mh.push(item);
        } else if (alt.includes("ci-ai") || alt.includes("ci_ai") || alt.includes("ci ai")) {
          buckets.codes["ci-ai"].push(item);
        } else if (alt.includes("ci")) {
          buckets.codes.ci.push(item);
        } else if (alt.includes("360v") || alt.includes("360°")) {
          buckets.codes.v360.push(item);
        } else if (isColorMatch(itemColor, targetColor)) {
          buckets.color.push(item);
        } else {
          buckets.extras.push(item);
        }
      } else if (itemColor === "" && !isAnyColor) {
         // Fallback for items with no color tokens at all
         buckets.extras.push(item);
      }
    });

    // Prioritize Shopify variant image if it exists in color bucket
    if (activeVariant?.image) {
      const getCompareUrl = (url) => formatCdnUrl(url).split('?')[0].split('&')[0];
      const variantImgUrl = getCompareUrl(activeVariant.image);
      const idx = buckets.color.findIndex(m => {
        const mUrl = m.url || m.previewImage?.url;
        return mUrl && getCompareUrl(mUrl) === variantImgUrl;
      });
      if (idx !== -1) {
        const vImg = buckets.color.splice(idx, 1)[0];
        buckets.color.unshift(vImg);
      }
    }

    const takeColor = () => buckets.color.shift() || null;
    const takeCode = () => {
      for (const key of ["mv-ai", "mv", "mq-ai", "mq", "mh-ai", "mh", "ci-ai", "ci", "360v"]) {
        const k = key === "360v" ? "v360" : key;
        if (buckets.codes[k]?.length) return buckets.codes[k].shift();
      }
      return null;
    };

    const slotPattern = [
      "color", "code", "code",
      "color", "color", "code", "code",
      "color", "color", "code", "code",
      "color"
    ];

    const result = [];

    for (const slot of slotPattern) {
      let node = slot === "color" ? takeColor() : takeCode();
      if (node) result.push(node);
    }

    // Append remaining
    Object.values(buckets.codes).forEach(arr => {
      arr.forEach(node => { if (!result.includes(node)) result.push(node); });
    });

    buckets.color.forEach(node => {
      if (!result.includes(node)) result.push(node);
    });

    buckets.extras.forEach(node => {
      if (!result.includes(node)) result.push(node);
    });

    buckets.cert.forEach(node => {
      if (!result.includes(node)) result.push(node);
    });

    if (result.length === 0 && formattedMedia.length > 0) return [formattedMedia[0]];

    return result;
}
