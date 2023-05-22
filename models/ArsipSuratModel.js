const mongoose = require("mongoose");
const { Schema } = mongoose;

const ArsipSuratSchema = new Schema({
  nama: {
    type: String,
    required: true,
  },
  nomor: {
    type: String,
    required: true,
    unique: true,
  },
  asal: {
    type: String,
    required: true,
    unique: true,
  },
  jenis: {
    type: String,
    enum: ["surat masuk", "surat keluar", "surat khusus"],
    default: "surat masuk",
    required: true,
  },
  tanggal: {
    type: String,
    required: true,
  },
  keterangan: {
    type: String,
    required: false,
  },
  file: {
    type: String,
    required: true,
  },
  isPDF: {
    type: Boolean,
    required: true,
  },
  urlFile: {
    type: String,
    required: true,
  },

  user: {
    type: Object,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("ArsipSurat", ArsipSuratSchema, "arsipSurat");
