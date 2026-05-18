import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const payload = await request.json();
    const webhookKey = process.env.NECTOR_WEBHOOK_KEY || "1b00001c-26f4-4b62-a601-4f874e63f108";
    
    const response = await fetch(`https://platform.nector.io/api/open/integrations/customcheckoutwebhook/${webhookKey}`, {
      method: 'POST',
      headers: { 
        'x-source': 'web',
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Nector API Proxy Error:", error);
    return NextResponse.json({ error: "Failed to communicate with Nector", message: error.message }, { status: 500 });
  }
}
