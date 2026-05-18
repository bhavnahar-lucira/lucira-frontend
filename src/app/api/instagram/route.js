import { NextResponse } from "next/server";

const INSTAGRAM_ACCESS_TOKEN = "IGAAVJNIZC9IvtBZAFpuQ05oZAEJNeUh2RU80MUxGbENadVZAObF93MEhmOENDNTQ3RXBwZA3pIQXZAhZAFN5UzZAQVklaOEYySm80Ym5WUFFPX2FwVndSSF9uTTRXZA3Itc1BQcDdua2xNYURma2I3TDZAhNnlnaWNfTDNFbGQxTVlYTGQ2cwZDZD";

export async function GET() {
  try {
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${INSTAGRAM_ACCESS_TOKEN}&limit=30`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Instagram API error:", errorData);
      return NextResponse.json({ error: "Failed to fetch Instagram data" }, { status: response.status });
    }

    const data = await response.json();
    
    const formattedData = data.data.map(item => ({
      id: item.id,
      image: item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url,
      mediaUrl: item.media_url,
      isVideo: item.media_type === "VIDEO",
      caption: item.caption || "",
      permalink: item.permalink,
      timestamp: item.timestamp
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching Instagram feed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
