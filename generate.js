const fs = require("fs");

const BASE_URL = "https://www.lbfmcams.com/onnow.php?wid=104247&cid=100&rid=1";
const DATA_FILE = "data.json";
const FEED_FILE = "feed.json";

async function fetchHTML() {
  const res = await fetch(BASE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
    }
  });
  if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
  return await res.text();
}

function extractModels(html) {
  const models = [];
  const seen = new Set();

  // Strong regex for Markdown links: [Name](performer.php?model_id=XXXX)
  const regex = /\[([A-Za-z0-9_]+)\]\(https?:\/\/www\.lbfmcams\.com\/performer\.php\?model_id=\d+\)/g;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const name = match[1].trim();

    if (!name || name.length < 3 || seen.has(name)) continue;
    seen.add(name);

    const fullLink = `https://www.lbfmcams.com/performer.php?model_id=${match[0].match(/model_id=(\d+)/)[1]}`;

    const image = `https://www.lbfmcams.com/shared/camthumb/${name.toLowerCase()}.jpg`;

    models.push({
      title: name,
      link: fullLink,
      image: image
    });
  }

  return models;
}

async function main() {
  try {
    console.log("🔄 Fetching live models from LBFM...");
    const html = await fetchHTML();
    const models = extractModels(html);

    console.log(`✅ Found ${models.length} live models`);

    fs.writeFileSync(DATA_FILE, JSON.stringify(models, null, 2));
    fs.writeFileSync(FEED_FILE, JSON.stringify(models, null, 2));

    console.log("✅ feed.json & data.json updated successfully!");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();
