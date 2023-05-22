const konversiWaktu = require("../middlewares/konversiWaktu");
const ArsipSurat = require("../models/ArsipSuratModel");
const Users = require("../models/UsersModel");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

// nama:
// nomor:
// tanggal:
// jenis:
// file:
// urlFile:
// user:
const generetName = async (len) => {
  const lowerAlphabet = "abcdefghijklmnopqrstuvwxyz";
  const upperAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numeric = "1234567890";

  const data = lowerAlphabet + upperAlphabet + numeric;
  let generator = "";
  for (let index = 0; index < len; index++) {
    generator += data[~~(Math.random() * data.length)];
    // generator += data[Math.floor(Math.random() * data.length)];
  }
  return generator;
};

const UploadSurat = async (req, res) => {
  try {
    const user = req.user;
    const file = req.files.file;
    const { nama, nomor, asal, jenis, tanggal, keterangan } = req.body;
    console.log(file);

    const cariUser = await Users.findById(user.id);
    if (!cariUser) return res.status(400).json({ msg: "Anda belum login" });
    console.log(cariUser);

    if (!nama || !nomor || !asal || !jenis || !keterangan || !tanggal || !file) return res.status(400).json({ msg: "Mohon lengkapi data surat" });
    const cekNomor = await ArsipSurat.findOne({ nomor: nomor });
    if (cekNomor) return res.status(400).json({ msg: "nomor sudah ada" });

    // "surat masuk", "surat keluar", "surat khusus"
    const getNama = await generetName(13);
    const fileExt = path.extname(file.name);
    const fileSize = file.data.length;
    const fileName = getNama + fileExt;
    const fileUrl = `${req.protocol}://${req.get("host")}/arsip/${fileName}`;
    const allowType = [".jpg", ".jpeg", ".png", ".pdf"];
    const PDF = ".pdf";
    let isPDF;
    if (!allowType.includes(fileExt.toLowerCase())) {
      return res.status(400).json({ msg: "hanya boleh file .jpg, .jpeg, .png, .pdf" });
    }
    if (PDF.includes(fileExt.toLowerCase())) {
      isPDF = true;
    } else {
      isPDF = false;
    }
    if (fileSize > 10000000) {
      return res.status(400).json({ msg: "File terlalu besar, maksimal 10MB" });
    }

    // const tanggal = await konversiWaktu();
    const dataSurat = {
      nama: nama,
      nomor: nomor,
      asal: asal,
      jenis: jenis,
      tanggal: tanggal,
      keterangan: keterangan,
      file: fileName,
      isPDF: isPDF,
      urlFile: fileUrl,
      user: {
        id: cariUser._id,
        nama: cariUser.nama,
        email: cariUser.email,
        jabatan: cariUser.jabatan,
      },
    };

    await file.mv(`./public/arsip/${fileName}`, async (err) => {
      // file.mv(`${__dirname}/../public/arsip/${fileName}`, async (err) => {
      if (err) {
        return res.status(500).json({ msg: err.message });
      }
    });
    const suratBaru = new ArsipSurat(dataSurat);
    await suratBaru.save();
    res.status(201).json(suratBaru);
  } catch (error) {
    res.status(500).json({ msg: "Gagal Mengupload Surat" });
  }
};
const SemuaSurat = async (req, res) => {
  try {
    const user = req.user;

    const cariUser = await Users.findById(user.id);
    if (!cariUser) {
      return res.status(400).json({ msg: "user Tidak ada" });
    }
    const totalDocuments = await ArsipSurat.countDocuments();
    const dataPerHalaman = 12;
    const totalHalaman = Math.ceil(totalDocuments / dataPerHalaman);

    let halaman = parseInt(req.headers.halaman) || 1;
    let skip = (halaman - 1) * dataPerHalaman;

    if (halaman > totalHalaman) {
      halaman = 1;
      skip = 0;
    }
    if (halaman <= 0) {
      halaman = totalHalaman;
      skip = (totalHalaman - 1) * dataPerHalaman;
      console.log(false);
    }

    const data = await ArsipSurat.find({}, { password: 0, __v: 0 }).sort({ nama: 1 }).skip(skip).limit(dataPerHalaman);
    // data.map((data, i) => {
    //   console.log(data.file);
    // });
    res.status(200).json({ data, halaman, totalHalaman, totalDocuments });
  } catch (error) {
    // console.error("Gagal Mengupload Surat", error);
    res.status(500).json({ msg: "Gagal mengambil data Surat", error });
  }
};
const cariJenisSurat = async (req, res) => {
  try {
    const user = req.user;
    console.log(2);
    const cariUser = await Users.findById(user.id);
    if (!cariUser) {
      return res.status(400).json({ msg: "user Tidak ada" });
    }

    let jenis = req.params.jenis;
    if (jenis === "suratmasuk") jenis = "surat masuk";
    if (jenis === "suratkeluar") jenis = "surat keluar";
    if (jenis === "suratkhusus") jenis = "surat khusus";

    let halaman = parseInt(req.headers.halaman) || 1;
    const dataPerHalaman = 12;
    let skip = (halaman - 1) * dataPerHalaman;

    Promise.all([ArsipSurat.countDocuments({ jenis: jenis }), ArsipSurat.find({ jenis: jenis }).limit(dataPerHalaman).skip(skip)]).then(([totalDocuments, data]) => {
      const totalHalaman = Math.ceil(totalDocuments / dataPerHalaman);
      console.log(data, totalHalaman, totalDocuments);
      res.status(200).json({
        data,
        totalHalaman,
        totalDocuments,
        halaman: parseInt(halaman),
      });
    });
  } catch (error) {
    // console.error("Gagal Mengupload Surat", error);
    res.status(500).json({ msg: "Gagal mengambil data Surat", error });
  }
};
const cariSuratByNama = async (req, res) => {
  try {
    const user = req.user;
    const cariUser = await Users.findById(user.id);
    if (!cariUser) {
      return res.status(400).json({ msg: "user Tidak ada" });
    }

    const nama = req.params.nama;
    ArsipSurat.find({ nama: { $regex: nama, $options: "i" } }).then((data) => {
      res.status(200).json({
        data,
      });
    });
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengambil data Surat", error });
  }
};
const EditSurat = async (req, res, next) => {
  try {
    const file = req.files.file;
    const { _id, nama, nomor, asal, jenis, tanggal, keterangan } = req.body;

    if (!nama || !nomor || !asal || !jenis || !keterangan || !tanggal || !file) return res.status(400).json({ msg: "Mohon lengkapi data surat" });

    const cariArsip = await ArsipSurat.findOne({ _id: _id });
    if (!cariArsip) {
      return res.status(400).json({ msg: "Arsip tidak ditemukan" });
    }

    const getNama = await generetName(13);
    const fileExt = path.extname(file.name);
    const fileSize = file.data.length;
    const fileName = getNama + fileExt;
    const fileUrl = `${req.protocol}://${req.get("host")}/arsip/${fileName}`;
    const allowType = [".jpg", ".jpeg", ".png", ".pdf"];
    const PDF = ".pdf";
    let isPDF;
    if (PDF.includes(fileExt.toLowerCase())) {
      isPDF = true;
    } else {
      isPDF = false;
    }
    const data = {
      nama: nama,
      nomor: nomor,
      asal: asal,
      jenis: jenis,
      tanggal: tanggal,
      keterangan: keterangan,
      file: fileName,
      isPDF: isPDF,
      urlFile: fileUrl,
    };

    if (!allowType.includes(fileExt.toLowerCase())) {
      return res.status(400).json({ msg: "File tidak diperbolehkan, hanya boleh file .jpg, .jpeg, .png, .pdf" });
    }
    if (fileSize > 10000000) {
      return res.status(400).json({ msg: "File terlalu besar, maksimal 10MB" });
    }

    const cekNomor = await ArsipSurat.findOne({ nomor: nomor });
    if (cekNomor) {
      if (cekNomor._id == _id) {
        file.mv(`./public/arsip/${fileName}`, async (err) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ msg: err.message });
          }
        });
        const filePath = `public/arsip/${cariArsip.file}`;
        fs.unlink(filePath, (err) => {
          console.log(err);
        });
        const UpdateSurat = await ArsipSurat.findOneAndUpdate(
          {
            _id: _id,
          },
          {
            $set: data,
          }
        );
        res.status(200).json({ data, msg: "sucses" });
      } else {
        return res.status(400).json({ message: "Email sudah digunakan" });
      }
    } else {
      await file.mv(`./public/arsip/${fileName}`, async (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ msg: err.message });
        }
      });
      const filePath = `public/arsip/${cariArsip.file}`;
      await fs.unlink(filePath, (err) => {
        console.log(err);
      });
      const UpdateSurat = await ArsipSurat.findOneAndUpdate(
        {
          _id: _id,
        },
        {
          $set: data,
        }
      );
      res.status(200).json({ data, msg: "sucses" });
    }
  } catch (error) {
    next();
  }
};
const EditSuratTanpaFile = async (req, res) => {
  try {
    const { _id, nama, nomor, asal, jenis, tanggal, keterangan } = req.body;
    if (!nama || !nomor || !asal || !jenis || !keterangan || !tanggal) return res.status(400).json({ msg: "Mohon lengkapi data surat" });

    const cariArsip = await ArsipSurat.findOne({ _id: _id });
    if (!cariArsip) {
      return res.status(400).json({ msg: "Arsip tidak ditemukan" });
    }

    const cekNomor = await ArsipSurat.findOne({ nomor: nomor });

    if (cekNomor && cekNomor.nomor !== cariArsip.nomor) {
      return res.status(400).json({ msg: "nomor sudah ada" });
    }

    const data = {
      nama: nama,
      nomor: nomor,
      asal: asal,
      jenis: jenis,
      tanggal: tanggal,
      keterangan: keterangan,
    };

    const UpdateSurat = await ArsipSurat.findOneAndUpdate(
      {
        _id: _id,
      },
      {
        $set: data,
      }
    );

    if (!UpdateSurat) {
      return res.status(404).json({ msg: "Data tidak ditemukan" });
    }
    res.status(200).json({ data });
  } catch (error) {
    res.status(511).json({ msg: "Gagal mengambil data profil" });
  }
};
const HapusSurat = async (req, res) => {
  const { _id } = req.body;
  try {
    const cariArsip = await ArsipSurat.findOne({ _id: _id });
    console.log(cariArsip);
    if (!cariArsip) {
      return res.status(400).json({ msg: "Arsip tidak ditemukan" });
    }
    console.log(cariArsip);

    const filePath = `public/arsip/${cariArsip.file}`;
    await fs.unlink(filePath, (err) => {
      console.log(err);
    });
    await ArsipSurat.findByIdAndDelete(_id);
    res.status(200).json({ msg: "berhasil Menghapus arsip" });
  } catch (error) {
    res.status(500).json({ msg: "Gagal menghapus arsip" });
  }
};
const DownloadArsip = async (req, res) => {
  try {
    const { filename } = req.headers;
    console.log(req.headers);
    console.log(filename);

    res.download(`./public/arsip/${filename}`);
  } catch (error) {
    res.status(400).json({ err: error });
  }
};
const BuatLaporan = async (req, res, next) => {
  try {
    const { tahun } = req.headers;
    const urlUtama = "https://www.google.com";
    const url = `${urlUtama}/${tahun}`;
    const fileName = generetName(10);
    const browser = await puppeteer.launch();
    const webPage = await browser.newPage();
    await webPage.goto(url, {
      waitUntil: "networkidle0",
    });
    await webPage.pdf({
      printBackground: true,
      displayHeaderFooter: false,
      format: "A4",
      path: `./public/laporan/${fileName}.pdf`,
      lanscape: true,
      margin: {
        top: "10px",
        bottom: "10px",
        left: "10px",
        right: "10px",
      },
    });
    console.log("sukses");
    req.fileName = fileName;
    next();
  } catch (err) {
    console.log(err);
    res.status(400).json({ err: error });
    console.log("err 1");
  }
};

const DownloadLaporan = async (req, res) => {
  try {
    const { fileName } = req.fileName;
    console.log(filename);

    res.download(`./public/laporan/${filename}`);
  } catch (error) {
    res.status(400).json({ err: error });
    console.log("err 2");
  }
};
module.exports = {
  UploadSurat,
  SemuaSurat,
  cariJenisSurat,
  cariSuratByNama,
  EditSurat,
  EditSuratTanpaFile,
  HapusSurat,
  DownloadArsip,
  BuatLaporan,
  DownloadLaporan,
};
