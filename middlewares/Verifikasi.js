const jwt = require("jsonwebtoken");

const VerifyToken = (req, res, next) => {
  const bearerHeaders = req.headers.authorization;
  // const bearerToken = bearerHeaders.split(" ")[1];
  // const { token } = req.body;
  // console.log(token);
  // const bearerToken = token;
  if (bearerHeaders == null) return res.sendStatus(401);
  jwt.verify(bearerHeaders, process.env.JWT_SECRET, (error, decoded) => {
    if (error) return res.sendStatus(403);
    req.user = decoded;
    console.log("verifi Sukses");
    next();
  });
};

module.exports = { VerifyToken };
