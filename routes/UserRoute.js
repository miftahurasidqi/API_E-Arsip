const express = require("express");
const { TambahUser, SemuaUser, Login, Saya, Edit, Hapus } = require("../controllers/UserCtrl");
const { VerifyToken } = require("../middlewares/Verifikasi");

const router = express.Router();

router.post("/tambah", VerifyToken, TambahUser);
router.post("/login", Login);
router.get("/semua", VerifyToken, SemuaUser);
router.get("/saya", VerifyToken, Saya);
router.patch("/edit", VerifyToken, Edit);
router.delete("/hapus", VerifyToken, Hapus);

module.exports = router;
