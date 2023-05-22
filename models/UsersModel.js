const mongoose = require("mongoose");
const { Schema } = mongoose;

const UsersSchema = new Schema({
  nama: {
    type: String,
    required: true,
  },
  fotoProfil: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  jabatan: {
    type: String,
    enum: ["kepala desa", "sekertaris desa", "kaur", "admin"],
    default: "admin",
  },
});

module.exports = mongoose.model("Users", UsersSchema, "users");
