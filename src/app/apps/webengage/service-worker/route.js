export async function GET() {
  const content = "importScripts('https://ssl.widgets.webengage.com/js/service-worker.js')";
  
  return new Response(content, {
    headers: {
      "Content-Type": "application/javascript",
      "Service-Worker-Allowed": "/",
    },
  });
}
