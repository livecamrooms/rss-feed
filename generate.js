const fs = require("fs");

const BASE_URL = "https://www.lbfmcams.com/onnow.php?wid=104247&cid=100&rid=1";
const DATA_FILE = "data.json";

async function fetchHTML() {
  const res = await fetch(BASE_URL, {
    headers: { 
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  });
  return await res.text();
}

function extractModels(html) {
  const items = [];
  const seen = new Set();

  // Better pattern for performer links + images
  const performerRegex = /<a[^>]+href="(performer\.php\?model_id=\d+)"[^>]*>[\s\S]*?([\w\s]+?)(?:<\/a>|\s*<br>)/gi;
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;

  let match;
  while ((match = performerRegex.exec(html)) !== null) {
    let link = match[1];
    const name = match[2].trim();

    if (!name || name.length < 3 || seen.has(link)) continue;
    seen.add(link);

    if (!link.startsWith("http")) {
      link = "https://www.lbfmcams.com/" + link;
    }

    // Try to find nearby image (thumbnails are usually near the link)
    const imgMatch = html.slice(Math.max(0, match.index - 500), match.index + 800).match(imgRegex);
    let image = imgMatch && imgMatch[0] ? imgMatch[0].match(/src="([^"]+)"/)[1] : 
                "https://www.lbfmcams.com/shared/images/default.jpg";

    if (!image.startsWith("http")) {
      image = "https://www.lbfmcams.com/" + image;
    }

    items.push({ title: name, link, image });
  }

  return items;
}

// ... rest of the file stays mostly the same (loadPrevious, getNewItems, buildRSS, main)
