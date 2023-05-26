const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Users = require("../models/UsersModel");
const EnkripsiPassword = require("../middlewares/EncriptPassword");

const TambahUser = async (req, res) => {
  const { nama, email, password, jabatan } = req.body;
  try {
    if (!nama || !email || !password || !jabatan) return res.status(400).json({ message: "Nama, Email, Password dan Jabatan harus disertakan" });
    const cekEmail = await Users.findOne({ email });
    if (cekEmail) return res.status(400).json({ msg: "Email sudah digunakan" });
    const passwordTerenkripsi = await EnkripsiPassword(password);
    const UserBaru = new Users({ nama, email, password: passwordTerenkripsi, jabatan });
    await UserBaru.save();
    const response = { nama, email, jabatan };
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ msg: "Gagal menambahkan User" });
  }
};
const SemuaUser = async (req, res) => {
  try {
    const halaman = parseInt(req.query.halaman) || 1;
    const dataPerHalaman = 10;
    const totalDocuments = await Users.countDocuments();
    const totalHalaman = Math.ceil(totalDocuments / dataPerHalaman);
    const skip = (halaman - 1) * dataPerHalaman;
    const data = await Users.find({}, { password: 0, __v: 0 }).sort({ nama: 1 }).skip(skip).limit(dataPerHalaman);
    res.status(200).json({ data, halaman, totalHalaman, totalDocuments });
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengambil data User" });
  }
};
const Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let User = await Users.findOne({ email });
    if (!User) {
      if (email === process.env.ADMINEMAIL && password === process.env.ADMINPASS) {
        const passwordTerenkripsi = await EnkripsiPassword(password);
        const UserBaru = new Users({ nama: "sekertaris desa", email: email, password: passwordTerenkripsi });
        await UserBaru.save();
        User = UserBaru;
      } else {
        return res.status(401).json({ msg: "email atau password salah" });
      }
    }
    const isPasswordValid = await bcrypt.compare(password, User.password);
    if (!isPasswordValid) return res.status(400).json({ msg: "email atau password salah" });
    const token = jwt.sign({ id: User._id, jabatan: User.jabatan }, process.env.JWT_SECRET || "secret", {
      expiresIn: "1w",
    });

    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      if (error) return res.sendStatus(403);
      console.log(decoded);
    });
    res.status(200).json({ token, User });
  } catch (error) {
    res.status(500).json({ msg: "Terjadi kesalahan saat mencoba login" });
  }
};
const Saya = async (req, res) => {
  try {
    const user = req.user;
    const User = await Users.findById(user.id, { password: 0, __v: 0 });
    if (!User) return res.status(404).json({ msg: "Data tidak ditemukan" });
    res.status(200).json({ data: User });
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengambil data profil" });
  }
};
const Edit = async (req, res) => {
  try {
    const user = req.user;
    const { _id, nama, email, password, jabatan, fotoProfil } = req.body;
    if (!_id || !nama || !email || !password || !jabatan) return res.status(400).json({ msg: "Nama, Email, Password dan jabatan harus disertakan" });

    const passwordTerenkripsi = await EnkripsiPassword(password);
    const data = {
      nama,
      email,
      jabatan,
      password: passwordTerenkripsi,
      fotoProfil,
    };

    const cariUser = await Users.findOne({ _id: _id });
    if (!cariUser) {
      return res.status(400).json({ msg: "User tidak ditemukan" });
    }
    const cekEmail = await Users.findOne({ email });
    if (cekEmail) {
      if (cekEmail._id == _id) {
        const User = await Users.findOneAndUpdate({ _id: _id }, { $set: data });
        if (!User) return res.status(404).json({ msg: "Data tidak ditemukan" });
        res.status(200).json({ data });
      } else {
        return res.status(400).json({ msg: "Email sudah digunakan" });
      }
    } else {
      console.log("Email belum digunakan");
      const User = await Users.findOneAndUpdate({ _id: _id }, { $set: data });
      if (!User) return res.status(404).json({ msg: "Data tidak ditemukan" });
      res.status(200).json({ data });
    }
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengambil data profil" });
  }
};

const Hapus = async (req, res) => {
  try {
    console.log(req.body);
    const { _id } = req.body;
    console.log(_id);
    const cariUser = await Users.findOne({ _id: _id });
    if (!cariUser) return res.status(400).json({ msg: "User tidak ditemukan" });
    const User = await Users.findByIdAndDelete(_id);
    res.status(200).json({ msg: "berhasil Menghapus user" });
  } catch (error) {
    res.status(500).json({ msg: "Gagal menghapus user" });
  }
};

module.exports = {
  TambahUser,
  SemuaUser,
  Login,
  Saya,
  Edit,
  Hapus,
};
