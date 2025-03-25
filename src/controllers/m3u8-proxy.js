const cloudscraper = require("cloudscraper");
const { PassThrough } = require("stream");

const allowedExtensions = ['.ts', '.png', '.jpg', '.webp', '.ico', '.html', '.js', '.css', '.txt'];

const m3u8Proxy = async (req, res) => {
  try {
    const url = req.query.url;

    if (!url) return res.status(400).json("url is required");

    console.log(`Fetching URL: ${url}`); // Log the URL being fetched

        // ✅ Add CORS Headers
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Range",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range",
    });

    if (allowedExtensions.some(ext => url.endsWith(ext))) {
      // Use cloudscraper to bypass Cloudflare for .ts files and other allowed extensions
      const response = await cloudscraper.get({
        uri: url,
        encoding: null, // Get the response as a buffer
        headers: {
          Accept: "*/*",
          Referer: "https://rapid-cloud.co/",
          Connection: "keep-alive",
        },
      });

      // Set headers and pipe the response
      res.set({
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      });

      const bufferStream = new PassThrough();
      bufferStream.end(response);
      return bufferStream.pipe(res);
    }

    // Use cloudscraper to bypass Cloudflare for .m3u8 files
    const response = await cloudscraper.get({
      uri: url,
      headers: {
        Accept: "*/*",
        Referer: "https://rapid-cloud.co/",
        Connection: "keep-alive",
      },
    });

    console.log("Response received from Cloudscraper:", response); // Log the response

    const originalContent = response;
    const modifiedContent = originalContent.split("\n").map((line) => {
      if (line.endsWith('.m3u8') || line.endsWith('.ts')) {
        return `m3u8-proxy?url=${url.replace(/[^/]+$/, "")}${line}`;
      }

      if (allowedExtensions.some(ext => line.endsWith(ext))) {
        return `m3u8-proxy?url=${line}`;
      }

      return line;
    }).join("\n");

    res.set({
      "Content-Type": "application/vnd.apple.mpegurl",
      "Cache-Control": "public, max-age=3600",
    });

    return res.status(200).send(modifiedContent);
  } catch (error) {
    console.error("Error fetching content:", error.message); // Log the full error
    console.error("Error stack:", error.stack); // Log the error stack for debugging
    return res.status(500).json({ error: "Failed to fetch the content", details: error.message });
  }
};

module.exports = { m3u8Proxy };
