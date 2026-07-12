const Video=require("../models/video");
const uploadVideo=async(req,res)=>{
    try{
        const {athlete,sport}=req.body;
        if(!req.file){
            return res.status(400).json({
                success:false,
                message:"Please upload a video",
            })
        }

        const video=await Video.create({
            athlete,
            uploadedBy:req.user.id,
            videoUrl:req.file.path,
            publicId:req.file.filename,
            sport,
            status:"Uploaded",
        });
        return res.status(201).json({
            success:true,
            message:"Video uploaded succesfully",
            video,
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            
            success:true,
            message:"Video upload failed",
           
        })
    }

}

module.exports={
    uploadVideo,
}
