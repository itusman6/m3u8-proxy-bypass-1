import express, { Request, Response } from "express";
import cloudscraper from "cloudscraper";
import { PassThrough } from "stream";

const router = express.Router();
const allowedExtensions = [".ts", ".png", ".jpg", ".webp", ".ico", ".html", ".js", ".css", ".txt"];

// ✅ Middleware to Handle CORS & Preflight Requests
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");  // Allow all origins
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
  res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // ✅ Respond to preflight requests
  }

  next();
});

// ✅ Proxy Endpoint
router.get("/m3u8-proxy", async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: "URL is required" });

    console.log(`🔗 Fetching URL: ${url}`);

    const headers = {
      "Accept": "*/*",
      "Referer": "https://rapid-cloud.co/",  // ✅ Make it seem like the request is coming from a valid source
      "Origin": "https://rapid-cloud.co",   // ✅ Helps with strict-origin-when-cross-origin issues
      "Connection": "keep-alive",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", // ✅ Some servers block non-browser requests
    };

    if (allowedExtensions.some(ext => url.endsWith(ext))) {
      const response = (await cloudscraper.get({
        uri: url,
        encoding: null, // Buffer response
        headers,
      })) as Buffer;

      res.set({
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      });

      const bufferStream = new PassThrough();
      bufferStream.end(response);
      return bufferStream.pipe(res);
    }

    const response = (await cloudscraper.get({
      uri: url,
      headers,
    })) as string;

    console.log("✅ Response received from Cloudscraper");

    const modifiedContent = response.split("\n").map((line) => {
      if (line.endsWith(".m3u8") || line.endsWith(".ts")) {
        return `m3u8-proxy?url=${url.replace(/[^/]+$/, "")}${line}`;
      }
      return line;
    }).join("\n");

    res.set({
      "Content-Type": "application/vnd.apple.mpegurl",
      "Cache-Control": "public, max-age=3600",
    });

    return res.status(200).send(modifiedContent);
  } catch (error: any) {
    console.error("❌ Error fetching content:", error.message);
    return res.status(500).json({ error: "Failed to fetch the content", details: error.message });
  }
});

export default router;
