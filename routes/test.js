const express = require("express");
const router = express.Router();
const testing = (req, res) => {
  res.status(200).json({ msg: "tes Berhasil" });
};

router.get("/", testing);
module.exports = router;
