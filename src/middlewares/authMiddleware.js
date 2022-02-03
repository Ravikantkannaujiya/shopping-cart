const jwt = require("jsonwebtoken")

const Authentication = async function (req, res, next) {
  try {
    const token = req.header('Authorization') 
    if (!token) {
      return res.status(403).send({ status: false, message: `Missing authentication token in request` })
    }
    tokenNew = token.split(' ')
    let requiredToken = tokenNew[1]
    const decoded = jwt.verify(requiredToken, 'group16');
    if (!decoded) {
      return res.status(400).send({ status: false, message: "Invalid authentication token in request headers." })
    }
    if (Date.now() > (decoded.exp) * 1000) { 
      return res.status(403).send({ status: false, message: "Token Expired Please login again." })
    }

    req.userId = decoded.userId;
    next()

  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}



module.exports.Authentication = Authentication;

