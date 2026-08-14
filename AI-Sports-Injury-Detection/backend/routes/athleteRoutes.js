
const express=require("express")
const router=express.Router();

const {createAthlete,getAllAthletes,getAthleteById,updateAthlete,deleteAthlete}=require("../controllers/athleteController");
const authMiddleware=require("../middleware/authMiddleware");
const authorizeRoles=require("../middleware/roleMiddleware");

router.post("/",authMiddleware,authorizeRoles("coach","admin","physiotherapist","sports_scientist") ,createAthlete);
router.get("/",authMiddleware,authorizeRoles("coach","admin","physiotherapist","sports_scientist","athlete"),getAllAthletes);
router.get("/:id",authMiddleware,authorizeRoles("coach","admin","physiotherapist","sports_scientist","athlete"),getAthleteById);
router.put("/:id",authMiddleware,authorizeRoles("coach","admin","physiotherapist","sports_scientist","athlete"),updateAthlete);
router.delete("/:id",authMiddleware,authorizeRoles("coach","admin","physiotherapist","sports_scientist"),deleteAthlete);


module.exports=router;
