// Dynamic Base URL helper
const getBaseUrl = (req) => {
  if (req) {
    const host = req.get("host");
    if (host) return `${req.protocol}://${host}`;
  }
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/+$/, "");
  }
  return "http://localhost:5000";
};

// Helper to format image/video URL
const formatMediaUrl = (media, req) => {
  if (!media) return "";
  if (media.startsWith("http://") || media.startsWith("https://")) return media;
  const base = getBaseUrl(req);
  const cleanPath = media.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${base}/${cleanPath}`;
};

module.exports = {
  getBaseUrl,
  formatMediaUrl,
};
