const express=require("express");
const router=express.Router();
const authMiddleware=require("../middleware/authMiddleware");
const authorizeRoles=require("../middleware/roleMiddleware");
const upload=require("../middleware/uploadMiddleware");
const { uploadVideo }=require("../controllers/videoController");

router.post(
    "/upload",
    authMiddleware,
    authorizeRoles("coach","admin"),
    upload.single("video"),
    uploadVideo

);

module.exports=router
