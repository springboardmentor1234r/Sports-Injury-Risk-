const Video=require("../models/video");
const { exec }=require("child_process");
const path=require("path");
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

        const aiPath=path.json(__dirname,"../../ai");
        exec(
            "Python utils/pose_detector.py",
            { cwd :aiPath },
            async(error,stdout,stderr)=>{
                if(error){
                    console.log(error);
                    return res.status(500).json({
                        success:false,
                        message:"AI analysis failed"
                    });
                }
                console.log(stdout);
                video.status="Completed";

                await video.save();
                return res.status(201).json({
                    success:true,
                    message:"Video uploaded and analyzed successfully",
                    video,
                    results:{
                        reportJson:
                           "/reports/report.json",

                        reportTxt:
                            "/outputs/report.txt",

                        graph:
                            "/outputs/knee_angles_graph.png",

                        analyzedVideo:
                            "/outputs/output_video.mp4"
   
                    }


                })
            }
        );





        return res.status(201).json({
            success:true,
            message:"Video uploaded succesfully",
            video,
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            
            success:false,
            message:"Video upload failed",
           
        })
    }

}

const getAllVideos=async(req,res)=>{
    try{
        const videos=await Video.find()
        .populate("athlete","name sport")
        .populate("uploadedBy","name email role")
        .sort({createdAt:-1});
        return res.status(200).json({
            success:true,
            count:videos.length,
            videos,
        })
    }catch{
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Failed to fetch videos"
        })
    }
}

module.exports={
    uploadVideo,
    getAllVideos,
}
