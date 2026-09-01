export default function shopifyLoader({ src, width, quality }) {
  const url = new URL(src);
  url.searchParams.set('width', width.toString());
  if (quality) {
    url.searchParams.set('quality', quality.toString());
  }
  return url.toString();
}
