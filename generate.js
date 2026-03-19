const fs = require("fs");

const BASE_URL = "https://www.lbfmcams.com/onnow.php?wid=104247&cid=100&rid=1";
const DATA_FILE = "data.json";

async function fetchHTML() {
  const res = await fetch(BASE_URL, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  return await res.text();
}

function extractModels(html) {
  const regex = /<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"/gi;
  const seen = new Set();
  const items = [];

  let match;
  while ((match = regex.exec(html)) !== null) {
    let link = match[1];
    const image = match[2];
    const name = (match[3] || "Live Model").trim();

    if (!link.startsWith("http")) {
      link = "https://www.lbfmcams.com/" + link;
    }

    if (seen.has(link)) continue;
    seen.add(link);

    items.push({ title: name, link, image });
  }

  return items;
}

function loadPrevious() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function getNewItems(current, previous) {
  const prevLinks = new Set(previous.map(i => i.link));
  return current.filter(i => !prevLinks.has(i.link));
}

function buildRSS(items) {
  const now = new Date().toUTCString();

  const rssItems = items.map(item => `
  <item>
    <title><![CDATA[${item.title}]]></title>
    <link>${item.link}</link>
    <description><![CDATA[
      <img src="${item.image}" width="200"/><br/>
      Watch now
    ]]></description>
    <pubDate>${now}</pubDate>
    <guid>${item.link}</guid>
  </item>`).join("");

  return `<?xml version="1.0"?>
<rss version="2.0">
<channel>
  <title>LBFM Live Cams</title>
  <link>${BASE_URL}</link>
  <description>New live models</description>
  <lastBuildDate>${now}</lastBuildDate>
  ${rssItems}
</channel>
</rss>`;
}

async function main() {
  const html = await fetchHTML();
  const current = extractModels(html);
  const previous = loadPrevious();
  const newItems = getNewItems(current, previous);

  fs.writeFileSync(DATA_FILE, JSON.stringify(current, null, 2));
  fs.writeFileSync("feed.xml", buildRSS(newItems));
  fs.writeFileSync("feed.json", JSON.stringify(current, null, 2));

  console.log(`New: ${newItems.length}, Total: ${current.length}`);
}

main();
