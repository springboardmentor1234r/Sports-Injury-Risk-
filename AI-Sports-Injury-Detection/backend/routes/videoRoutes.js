const express=require("express");
const {uploadVideo,getAllVideos}=require("../controllers/videoController")
const router=express.Router();
const authMiddleware=require("../middleware/authMiddleware");
const authorizeRoles=require("../middleware/roleMiddleware");
const upload=require("../middleware/uploadMiddleware");

router.post(
    "/upload",
    authMiddleware,
    authorizeRoles("coach","admin"),
    upload.single("video"),
    uploadVideo

);

router.get(
    "/",
    authMiddleware,
    authorizeRoles("coach","admin"),
    getAllVideos
)

module.exports=router
