// src/utils/videoUtils.js

/**
 * Convierte una URL de video (YouTube, Instagram, Facebook, TikTok) 
 * en una URL apta para ser incrustada en un iframe.
 */
export const getEmbedUrl = (url) => {
  if (!url) return "";

  // 1. YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}`;
  }

  // 2. Instagram
  if (url.includes("instagram.com")) {
    let cleanUrl = url.split("?")[0];
    if (cleanUrl.endsWith("/")) cleanUrl = cleanUrl.slice(0, -1);
    return `${cleanUrl}/embed`;
  }

  // 3. Facebook
  if (url.includes("facebook.com")) {
    if (url.includes("plugins/video.php")) return url;
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`;
  }

  // 4. TikTok
  if (url.includes("tiktok.com")) {
    const match = url.match(/\/video\/(\d+)/);
    if (match && match[1]) return `https://www.tiktok.com/embed/v2/${match[1]}`;
  }

  return url;
};
