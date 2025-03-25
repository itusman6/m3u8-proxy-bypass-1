import cloudscraper from "cloudscraper";
import { Request, Response } from "express";
import { PassThrough } from "stream";

const allowedExtensions = ['.ts', '.png', '.jpg', '.webp', '.ico', '.html', '.js', '.css', '.txt'];

export const m3u8Proxy = async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: "URL is required" });

    console.log(`🔗 Fetching URL: ${url}`);

    // ✅ Add CORS Headers to Prevent "strict-origin-when-cross-origin" Errors
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Range",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range",
    });

    const headers = {
      "Accept": "*/*",
      "Referer": "https://rapid-cloud.co/", // ✅ Fixes strict-origin issues
      "Origin": "https://rapid-cloud.co", // ✅ Some servers require a valid origin
      "Connection": "keep-alive",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", // ✅ Mimics a real browser
    };

    if (allowedExtensions.some(ext => url.endsWith(ext))) {
      // ✅ Bypass Cloudflare for .ts and other allowed files
      const response = await cloudscraper.get({ uri: url, encoding: null, headers });

      res.set({
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      });

      const bufferStream = new PassThrough();
      bufferStream.end(response);
      return bufferStream.pipe(res);
    }

    // ✅ Fetch and Modify .m3u8 Content
    const response = await cloudscraper.get({ uri: url, headers });
    console.log("✅ Response received from Cloudscraper");

    const modifiedContent = (response as string)
      .split("\n")
      .map((line) => {
        if (line.endsWith(".m3u8") || line.endsWith(".ts")) {
          return `m3u8-proxy?url=${url.replace(/[^/]+$/, "")}${line}`;
        }
        return line;
      })
      .join("\n");

    res.set({
      "Content-Type": "application/vnd.apple.mpegurl",
      "Cache-Control": "public, max-age=3600",
    });

    return res.status(200).send(modifiedContent);
  } catch (error: any) {
    console.error("❌ Error fetching content:", error.message);
    return res.status(500).json({ error: "Failed to fetch the content", details: error.message });
  }
};
