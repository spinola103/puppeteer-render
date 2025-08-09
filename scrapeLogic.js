const puppeteer = require("puppeteer");
require("dotenv").config();

const scrapeLogic = async (res) => {
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
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024 });

    // Change username or search query as needed
    const username = "elonmusk"; // or from req.query.username
    await page.goto(`https://twitter.com/${username}`, {
      waitUntil: "networkidle2",
    });

    // Wait until tweets are loaded
    await page.waitForSelector("article", { timeout: 10000 });

    const tweetsData = await page.$$eval("article", (tweets) => {
      return tweets.map((article) => {
        const tweetText =
          article.querySelector("div[lang]")?.innerText?.trim() || "";
        const user =
          article.querySelector("div span span")?.innerText?.trim() || "";
        const timestamp =
          article.querySelector("time")?.getAttribute("datetime") || "";
        const link =
          article.querySelector('a[role="link"][tabindex="-1"]')?.href || "";
        const likeCount =
          article.querySelector('div[data-testid="like"]')?.innerText || "0";
        const retweetCount =
          article.querySelector('div[data-testid="retweet"]')?.innerText || "0";
        const replyCount =
          article.querySelector('div[data-testid="reply"]')?.innerText || "0";
        const verified = !!article.querySelector(
          'svg[aria-label="Verified account"]'
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
