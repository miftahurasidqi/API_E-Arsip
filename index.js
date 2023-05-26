const FileUpload = require("express-fileupload");
const mongoose = require("mongoose");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const ArsipSuratRoute = require("./routes/ArsipSuratRoute");
const UserRoute = require("./routes/UserRoute");
const test = require("./routes/test");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(FileUpload());
app.use(express.static("public"));

app.use("/arsipsurat", ArsipSuratRoute);
app.use("/user", UserRoute);
app.use("/test", test);
app.use("/", (req, res) => {
  res.json({ msg: "api run" });
});

const PORT = process.env.PORT;
const ConectionsMongoDB = process.env.MONGO_URI;
mongoose
  .connect(ConectionsMongoDB)
  .then(() => {
    console.log("Terhubung dengan MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Gagal terhubung dengan MongoDB:", err);
  });
