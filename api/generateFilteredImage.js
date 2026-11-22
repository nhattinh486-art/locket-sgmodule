const FRAME_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

export async function GET() {
  return Response.json({
    ok: true,
    service: "locket-custom-frames",
    usage: "POST { data: { image_url, filter_id } }"
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const data = body && typeof body === "object" ? (body.data || body) : null;

    if (!data || typeof data !== "object") {
      return Response.json({ error: "Missing data object" }, { status: 400 });
    }

    const imageUrl = String(data.image_url || data.imageUrl || "").trim();
    const filterId = String(data.filter_id || data.filterId || data.prompt || "").trim();

    if (!imageUrl || !/^https:\/\//i.test(imageUrl)) {
      return Response.json({ error: "Invalid image_url" }, { status: 400 });
    }

    if (!FRAME_ID_RE.test(filterId)) {
      return Response.json({ error: "Invalid filter_id" }, { status: 400 });
    }

    const url = new URL(request.url);
    const renderUrl = `${url.origin}/api/render?frame=${encodeURIComponent(filterId)}&src=${encodeURIComponent(imageUrl)}`;

    return Response.json({
      result: {
        status: 200,
        image_url: renderUrl,
        filtered_image_url: renderUrl,
        transformed_image_url: renderUrl,
        url: renderUrl,
        data: {
          image_url: renderUrl,
          filtered_image_url: renderUrl,
          transformed_image_url: renderUrl,
          url: renderUrl
        }
      }
    });
  } catch (err) {
    console.error("[generateFilteredImage] Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
