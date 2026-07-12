
const Athlete=require("../models/Athlete");

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
        const athletes=await Athlete.find().populate(
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
        const athlete=await Athlete.findByIdAndUpdate(
            req.params.id,
            req.body,{
                new:true,
                runValidators:true
            }
        ).populate("createdBy","name email role")
        if(!athlete){
            return res.status(404).json({
                success:false,
                message:"Athlete not found"
            })
        }
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