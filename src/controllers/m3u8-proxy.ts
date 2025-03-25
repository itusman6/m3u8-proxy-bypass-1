import express, { Request, Response } from "express";
import cloudscraper from "cloudscraper";
import { PassThrough } from "stream";

const router = express.Router();

const allowedExtensions = [".ts", ".png", ".jpg", ".webp", ".ico", ".html", ".js", ".css", ".txt"];

router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
  res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

router.get("/m3u8-proxy", async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: "URL is required" });

    console.log(`Fetching URL: ${url}`);

    if (allowedExtensions.some(ext => url.endsWith(ext))) {
      const response = (await cloudscraper.get({
        uri: url,
        encoding: null, // Get the response as a buffer
        headers: {
          Accept: "*/*",
          Referer: "https://rapid-cloud.co/",
          Connection: "keep-alive",
        },
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
      headers: {
        Accept: "*/*",
        Referer: "https://rapid-cloud.co/",
        Connection: "keep-alive",
      },
    })) as string;

    console.log("Response received from Cloudscraper");

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
    console.error("Error fetching content:", error.message);
    return res.status(500).json({ error: "Failed to fetch the content", details: error.message });
  }
});

export default router;
