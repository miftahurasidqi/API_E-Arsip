const bcrypt = require("bcrypt");

const EnkripsiPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const passwordTerenkripsi = await bcrypt.hash(password, salt);
  return passwordTerenkripsi;
};

module.exports = EnkripsiPassword;
