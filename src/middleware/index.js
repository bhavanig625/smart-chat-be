const { admin } = require("../config/firebase");
const verifyToken = async (req, res, next) => {
  //const idToken = req.cookies.accessToken;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    console.log("Token verified successfully:");
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(403).json({ error: "Unauthorized" });
  }
};

module.exports = verifyToken;
