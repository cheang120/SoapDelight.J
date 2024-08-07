// const jwt = require("jsonwebtoken")
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
// const crypto = require("crypto");

export const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn:"1d"})
}

// Hash Token
export const hashToken = (token) => {
    return crypto.createHash("sha256").update(token.toString()).digest("hex");
};

// module.exports = {
//     generateToken,hashToken
// }
