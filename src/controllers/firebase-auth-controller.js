const {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  admin,
} = require("../config/firebase");
const auth = getAuth();

class FirebaseAuthController {
  async setUser(req, res, next) {
    // const idToken = req.cookies.accessToken;
    const idToken = req.headers.authorization?.split(" ")[1];
    if (!idToken) {
      return res.status(403).json({ error: "No token provided" });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      //   req.user = decodedToken;
      const userData = {
        uid: decodedToken.uid,
        name: decodedToken.name,
        email: decodedToken.email,
      };
      res.json(userData);
      console.log("User set successfully", userData);
      next();
    } catch (error) {
      console.error("Error verifying token:", error);
      return res.status(403).json({ error: "Unauthorized" });
    }
  }

  async signInWithGoogle(req, res) {
    console.log("inside signinwithgoogle");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log(result.user);
      res.json(result.user);
    } catch (error) {
      console.log("Google sign in error:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async signOut(req, res) {
    try {
      await signOut(auth);
      res.json({ message: "User signed out" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new FirebaseAuthController();
