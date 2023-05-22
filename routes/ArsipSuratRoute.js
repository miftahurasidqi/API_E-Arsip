const express = require("express");
const { UploadSurat, SemuaSurat, cariJenisSurat, cariSuratByNama, EditSurat, EditSuratTanpaFile, HapusSurat, DownloadArsip, BuatLaporan, DownloadLaporan } = require("../controllers/ArsipSuratCtrl");
const { VerifyToken } = require("../middlewares/Verifikasi");

const router = express.Router();

router.post("/upload", VerifyToken, UploadSurat);
router.get("/download", VerifyToken, DownloadArsip);
router.get("/laporan/download", VerifyToken, BuatLaporan, DownloadLaporan);
router.get("/semua", VerifyToken, SemuaSurat);
router.get("/cari/:nama", VerifyToken, cariSuratByNama);
router.get("/:jenis", VerifyToken, cariJenisSurat);
router.patch("/update", VerifyToken, EditSurat, EditSuratTanpaFile);
router.delete("/hapus", VerifyToken, HapusSurat);

module.exports = router;
