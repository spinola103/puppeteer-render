const puppeteer = require("puppeteer");
require("dotenv").config();

const scrapeLogic = async (req, res) => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

  try {
    const username = req.query.username || "phantom"; // Dynamic username
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024 });

    await page.goto(`https://twitter.com/${username}`, {
      waitUntil: "networkidle2",
    });

    // Wait until tweets are loaded
    await page.waitForSelector("article", { timeout: 15000 });

    const tweetsData = await page.$$eval("article", (tweets) => {
      return tweets.map((article) => {
        const tweetText =
          article.querySelector("div[lang]")?.innerText?.trim() || "";
        const user =
          article.querySelector("div span span")?.innerText?.trim() || "";
        const timestamp =
          article.querySelector("time")?.getAttribute("datetime") || "";

        // Correct tweet permalink
        const linkElem = article.querySelector("time")?.parentElement;
        const link = linkElem?.getAttribute("href")
          ? `https://twitter.com${linkElem.getAttribute("href")}`
          : "";

        // Function to parse counts from aria-label
        const getCount = (label) => {
          const btn = [...article.querySelectorAll('div[role="button"]')].find(
            (el) =>
              el.getAttribute("aria-label")?.toLowerCase().includes(label)
          );
          if (!btn) return "0";
          const match = btn
            .getAttribute("aria-label")
            .match(/\d+(?:,\d{3})*/);
          return match ? match[0].replace(/,/g, "") : "0";
        };

        const likeCount = getCount("like");
        const retweetCount = getCount("retweet");
        const replyCount = getCount("reply");

        const verified = !!article.querySelector(
          'svg[aria-label="Verified account"], svg[aria-label="Verified"]'
        );

        return {
          tweetText,
          user,
          timestamp,
          link,
          likeCount,
          retweetCount,
          replyCount,
          verified,
        };
      });
    });

    console.log(tweetsData);
    res.json({ tweets: tweetsData });
  } catch (e) {
    console.error(e);
    res.status(500).send(`Something went wrong while running Puppeteer: ${e}`);
  } finally {
    await browser.close();
  }
};

module.exports = { scrapeLogic };
