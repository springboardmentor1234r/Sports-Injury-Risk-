
const express=require("express")
const router  =express.Router();
const {registerUser,loginUser}=require("../controllers/authController");
const authMiddleware=require("../middleware/authMiddleware");
const {getProfile}=require("../controllers/profileController")
const authorizeRoles=require("../middleware/roleMiddleware");



router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/profile",authMiddleware,authorizeRoles("admin"),getProfile);
module.exports=router;