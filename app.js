import express from "express";
import cors from "cors";
import axios from "axios";
import NodeCache from "node-cache";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from "public" directory
app.use(express.static(path.join(__dirname, "public")));

const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

let news = [
  { id: 1, title: "Breaking News", body: "Latest update from CYGNUS ATER." },
  { id: 2, title: "Tech News", body: "Tech updates will appear here." },
];

// ** API Logging Middleware **
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ** Root Route - Serves the Console UI **
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ** CRUD Operations ** //

// Get all local news
app.get("/api/news", (req, res) => {
  res.json(news);
});

// Get a single news item
app.get("/api/news/:id", (req, res) => {
  const article = news.find((n) => n.id === parseInt(req.params.id));
  article ? res.json(article) : res.status(404).json({ error: "Not found" });
});

// Create a news item
app.post("/api/news", (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: "Missing fields" });

  const newArticle = { id: news.length + 1, title, body };
  news.push(newArticle);
  res.status(201).json(newArticle);
});

// Update a news item
app.put("/api/news/:id", (req, res) => {
  const { title, body } = req.body;
  const article = news.find((n) => n.id === parseInt(req.params.id));

  if (!article) return res.status(404).json({ error: "Not found" });

  article.title = title || article.title;
  article.body = body || article.body;
  res.json(article);
});

// Delete a news item
app.delete("/api/news/:id", (req, res) => {
  news = news.filter((n) => n.id !== parseInt(req.params.id));
  res.json({ message: "Deleted successfully" });
});

// ** Fetch Real-Time News from Public APIs ** //
const newsSources = [
  {
    name: "NewsAPI",
    url: `https://newsapi.org/v2/top-headlines?country=us&apiKey=${process.env.NEWS_API_KEY}`,
  },
  {
    name: "NYTimes",
    url: `https://api.nytimes.com/svc/topstories/v2/home.json?api-key=${process.env.NYT_API_KEY}`,
  },
  {
    name: "Guardian",
    url: `https://content.guardianapis.com/search?api-key=${process.env.GUARDIAN_API_KEY}`,
  },
];

// Get aggregated news from multiple sources
app.get("/api/news/external", async (req, res) => {
  const cachedData = cache.get("aggregatedNews");
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const newsResponses = await Promise.all(
      newsSources.map((source) => axios.get(source.url))
    );

    const aggregatedNews = newsResponses.map((response, index) => ({
      source: newsSources[index].name,
      articles: response.data.articles || response.data.results || [],
    }));

    cache.set("aggregatedNews", aggregatedNews);
    res.json(aggregatedNews);
  } catch (error) {
    console.error("Error fetching external news:", error.message);
    res.status(500).json({ error: "Error fetching news" });
  }
});

// ** Pagination Support ** //
app.get("/api/news/paginate", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedNews = news.slice(startIndex, endIndex);
  res.json({
    page,
    limit,
    total: news.length,
    results: paginatedNews,
  });
});

// ** Handle 404 Errors **
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ** Start Server ** //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
