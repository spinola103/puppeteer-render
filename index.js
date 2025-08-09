const express = require("express");
const { scrapeLogic } = require("./scrapeLogic");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// Pass both req and res
app.get("/scrape", (req, res) => {
  scrapeLogic(req, res);
});

app.get("/", (req, res) => {
  res.send("Render Puppeteer Twitter Scraper is running!");
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
