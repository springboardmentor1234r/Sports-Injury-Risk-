
const Athlete=require("../models/Athlete");
const User=require("../models/User");

const createAthlete=async(req,res)=>{
    try{
        const{name,age,gender,sport,team,position,height,weight,dominantLeg,injuryHistory}=req.body;
        const athlete = new Athlete({
            name,
            age,
            gender,
            sport,
            team,
            position,
            height,
            weight,
            dominantLeg,
            injuryHistory,
            isProfileComplete: true,
            createdBy: req.user.id
        });
        await athlete.save();
        return res.status(201).json({
            success:true,
            message:"Athlete created successfully",
            athlete
        });

    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:"Failed to create athlete"
        })

    }
}

const getAllAthletes=async(req,res)=>{
    try{
        let query = {};
        const currentUser = await User.findById(req.user.id);
        if (currentUser && currentUser.role === "athlete") {
            const count = await Athlete.countDocuments({ name: { $regex: new RegExp("^" + currentUser.name + "$", "i") } });
            if (count === 0) {
                const defaultAthlete = new Athlete({
                    name: currentUser.name,
                    age: 22,
                    gender: "Other",
                    sport: "Running",
                    team: "Individual",
                    position: "N/A",
                    height: 175,
                    weight: 70,
                    dominantLeg: "Right",
                    injuryHistory: [],
                    isProfileComplete: false,
                    createdBy: currentUser._id
                });
                await defaultAthlete.save();
            }
            query.name = { $regex: new RegExp("^" + currentUser.name + "$", "i") };
        }

        const athletes=await Athlete.find(query).populate(
            "createdBy",
            "name email role"
        );
        return res.status(200).json({
            success:true,
            count:athletes.length,
            athletes
        });

    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:"Failed to fetch athletes"
        })
    }

}
const getAthleteById= async (req,res)=>{
    try{
        const athlete=await Athlete.findById(req.params.id).populate(
            "createdBy",
            "name email role"
        );
        if (!athlete){
            return res.status(404).json({
                success:false,
                message:"Athlete not found"
            });
        }

        const currentUser = await User.findById(req.user.id);
        if (currentUser && currentUser.role === "athlete" && athlete.name !== currentUser.name) {
            return res.status(403).json({
                success:false,
                message:"Access Denied: You can only view your own profile"
            });
        }

        return res.status(200).json({
            success:true,
            athlete
        });

    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Failed to fetch athlete"
        })


    }
}

const updateAthlete=async(req,res)=>{
    try{
        const athleteCheck=await Athlete.findById(req.params.id);
        if(!athleteCheck){
            return res.status(404).json({
                success:false,
                message:"Athlete not found"
            });
        }

        const currentUser = await User.findById(req.user.id);
        if (currentUser && currentUser.role === "athlete" && athleteCheck.name !== currentUser.name) {
            return res.status(403).json({
                success:false,
                message:"Access Denied: You can only update your own profile"
            });
        }

        req.body.isProfileComplete = true;
        const athlete=await Athlete.findByIdAndUpdate(
            req.params.id,
            req.body,{
                new:true,
                runValidators:true
            }
        ).populate("createdBy","name email role")

        return res.status(200).json({
            success:true,
            message:"Athlete updated successfully",
            athlete
        }) 
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Failed to update the athlete"
        })
    }
}


const deleteAthlete= async(req,res)=>{
    try{
        const athlete=await Athlete.findByIdAndDelete(req.params.id)
        if(!athlete){
            return res.status(404).json({
                success:false,
                message:"Athlete not found"
            })
        }
        return res.status(200).json({
            success:true,
            message:"Athlete deleted successfully"
        })

    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Failed to delete the athlete"
        })
    }
}
module.exports={
    createAthlete,
    getAllAthletes,
    getAthleteById,
    updateAthlete,
    deleteAthlete
}