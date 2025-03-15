const express = require("express");
const app = express();
const multer = require("multer");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const knex = require("knex");
const morgan = require("morgan");

const image = require("./controllers/image");
const register = require("./controllers/register");
const signin = require("./controllers/signin");
const profile = require("./controllers/profile");
const auth = require("./controllers/authorization");
const signout = require("./controllers/signout");

const db = knex({
  client: "pg",
  connection: process.env.POSTGRES_URI,
});

app.use(morgan("combined"));
app.use(express.json());
app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.send("success");
});

app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const results = await image.uploadImage(req.file.path);
    console.log(req.file.path);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: "Error uploading image" });
  }
});

app.post("/signup", (req, res) => {
  register.handleRegister(req, res, db, bcrypt);
});
app.post("/signin", signin.signInAuthentication(db, bcrypt));
app.get("/signout", (req, res) => {
  signout.handleSignout(req, res);
});

app.get("/profile/:id", (req, res) => {
  profile.handleProfileGet(req, res, db);
});
app.post("/profile/:id", auth.requireAuth, (req, res) => {
  profile.handleProfileUpdate(req, res, db);
});

app.listen(3000, () => {
  console.log("app is running on port 3000");
});
