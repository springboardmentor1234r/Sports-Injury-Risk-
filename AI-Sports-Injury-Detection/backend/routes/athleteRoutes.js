
const express=require("express")
const router=express.Router();

const {createAthlete,getAllAthletes,getAthleteById,updateAthlete,deleteAthlete}=require("../controllers/athleteController");
const authMiddleware=require("../middleware/authMiddleware");
const authorizeRoles=require("../middleware/roleMiddleware");

router.post("/",authMiddleware,authorizeRoles("coach","admin") ,createAthlete);
router.get("/",authMiddleware,authorizeRoles("coach","admin"),getAllAthletes);
router.get("/:id",authMiddleware,authorizeRoles("coach","admin"),getAthleteById);
router.put("/:id",authMiddleware,authorizeRoles("coach","admin"),updateAthlete);
router.delete("/:id",authMiddleware,authorizeRoles("coach","admin"),deleteAthlete);


module.exports=router;
