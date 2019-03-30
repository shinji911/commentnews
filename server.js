const express = require("express");
const mongoose = require("mongoose");

const axios = require("axios");
const cheerio = require("cheerio");

const PORT = process.env.PORT || 8080;

const app = express();

app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

const db = require("./models");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

// Routes

// Route to the main page
app.get("/", function (req,res) {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Route to scrape articles from the Onion
app.get("/scrape", function (req, res) {
  axios.get("https://politics.theonion.com/").then(function (response) {
    const $ = cheerio.load(response.data);

    $("article.postlist__item").each(function (i, element) {
      let result = {};

      result.title = $(this)
        .children("header").children("h1").children("a")
        .text();
      result.link = $(this)
        .children("header").children("h1").children("a")
        .attr("href");
      result.summary = $(this)
        .children("div.item__content").children("div.excerpt").children("p")
        .text();

      //prevent duplicate article
      db.Article.findOne({ title: result.title })
        .then(function (findResult) {
          if (findResult) {
            console.log("Duplicate article not saved");
          } else {
            db.Article.create(result)
              .then(function (dbArticle) {
                console.log(dbArticle);
              })
              .catch(function (err) {
                console.log(err);
              });
          };
        });
    });
    res.status(200);
  });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  db.Article.find({}).sort({ _id:-1 })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with its Comments
app.get("/articles/:id", function (req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("comments")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Comment
app.post("/articles/:id", function (req, res) {
  db.Comment.create(req.body)
    .then(function (dbComment) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: {comments: dbComment._id} }, { new: true });
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});