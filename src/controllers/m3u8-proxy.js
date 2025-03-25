const express = require("express");
const cloudscraper = require("cloudscraper");
const { PassThrough } = require("stream");

const allowedExtensions = [".ts", ".png", ".jpg", ".webp", ".ico", ".html", ".js", ".css", ".txt"];

const m3u8Proxy = async (req, res) => {
  try {
    const url = req.query.url;

    if (!url) return res.status(400).json("url is required");

    console.log(`Fetching URL: ${url}`); // Log the URL being fetched

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

// ✅ Proxy Route
app.get("/m3u8-proxy", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "URL is required" });

    console.log(`🔗 Fetching URL: ${url}`);

    const headers = {
      "Accept": "*/*",
      "Referer": "https://rapid-cloud.co/",  // ✅ Helps with strict-origin-when-cross-origin
      "Origin": "https://rapid-cloud.co",   // ✅ Some sites require a valid origin
      "Connection": "keep-alive",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", // ✅ Mimic a real browser
    };

    if (allowedExtensions.some(ext => url.endsWith(ext))) {
      const response = await cloudscraper.get({
        uri: url,
        encoding: null, // Buffer response
        headers,
      });

      res.set({
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      });

      const bufferStream = new PassThrough();
      bufferStream.end(response);
      return bufferStream.pipe(res);
    }

    const response = await cloudscraper.get({ uri: url, headers });

    console.log("✅ Response received from Cloudscraper");

    const modifiedContent = response
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
  } catch (error) {
    console.error("❌ Error fetching content:", error.message);
    return res.status(500).json({ error: "Failed to fetch the content", details: error.message });
  }
});

module.exports = { m3u8Proxy };
