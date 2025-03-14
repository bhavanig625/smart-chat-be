const express = require("express");
const router = express.Router();

const aiProcessController = require("../controllers/ai-process-controller");
const verifyToken = require("../middleware/index");

router.post("/api/train", verifyToken, aiProcessController.trainModel);
router.post("/api/retrieve", verifyToken, aiProcessController.retieveData);

module.exports = router;
