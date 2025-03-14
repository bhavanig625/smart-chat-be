const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const router = require("./routes/index");
const PORT = process.env.PORT || 8080;
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use(
  cors({
    origin: "http://localhost:3000", // Change this to your frontend URL
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  })
);

app.use(bodyParser.json());

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

app.use(router);
