const User=require("../models/User");


const getProfile=async (req,res)=>{
    try{
        const user=await User.findById(req.user.id);
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }
        return res.status(200).json({
            success:true,
            message:"Profile fetched successfully",
            user
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Server Error"
        });

    }
} 
module.exports={
    getProfile
}