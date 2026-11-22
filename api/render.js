import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const FRAME_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const GITHUB_FRAMES_BASE =
  process.env.GITHUB_FRAMES_BASE ||
  "https://raw.githubusercontent.com/nhattinh486-art/locket-sgmodule/main/frames";

const ALLOWED_SRC_HOSTS = [
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "locketcamera.com",
  "raw.githubusercontent.com"
];

function isAllowedSourceUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_SRC_HOSTS.some(
      (allowed) => host === allowed || host.endsWith("." + allowed)
    );
  } catch {
    return false;
  }
}

async function loadFrameBuffer(frameId) {
  const localPath = path.join(process.cwd(), "frames", `${frameId}.png`);
  try {
    return await fs.readFile(localPath);
  } catch {
    // Fallback: fetch directly from GitHub so newly uploaded PNGs work without redeploying
    const remoteUrl = `${GITHUB_FRAMES_BASE}/${encodeURIComponent(frameId)}.png`;
    const res = await fetch(remoteUrl);
    if (!res.ok) {
      throw new Error(`Frame not found: ${frameId} (HTTP ${res.status})`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const frameId = String(searchParams.get("frame") || "").trim();
    const srcUrl = String(searchParams.get("src") || "").trim();

    if (!FRAME_ID_RE.test(frameId)) {
      return Response.json({ error: "Invalid frame id" }, { status: 400 });
    }
    if (!isAllowedSourceUrl(srcUrl)) {
      return Response.json({ error: "Source URL host not allowed" }, { status: 400 });
    }

    const [frameBuffer, srcRes] = await Promise.all([
      loadFrameBuffer(frameId),
      fetch(srcUrl)
    ]);

    if (!srcRes.ok) {
      return Response.json(
        { error: `Failed to fetch source photo (HTTP ${srcRes.status})` },
        { status: 502 }
      );
    }

    const srcBuffer = Buffer.from(await srcRes.arrayBuffer());
    const frameMeta = await sharp(frameBuffer).metadata();
    const width = frameMeta.width || 1080;
    const height = frameMeta.height || 1080;

    // Resize photo to cover the frame canvas (respecting EXIF rotation), then overlay PNG frame
    const outputBuffer = await sharp(srcBuffer)
      .rotate()
      .resize(width, height, { fit: "cover", position: "centre" })
      .composite([{ input: frameBuffer, blend: "over" }])
      .jpeg({ quality: 90 })
      .toBuffer();

    return new Response(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (err) {
    console.error("[render] Error:", err);
    return Response.json({ error: err.message || "Render failed" }, { status: 500 });
  }
}
