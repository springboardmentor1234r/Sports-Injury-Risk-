
const mongoose=require("mongoose");
const videoSchema=new mongoose.Schema(
    {
        athlete:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Athlete",
            required:true, 
        },
        uploadedBy:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        videoUrl:{
            type:String,
            required:true,

        },
        publicId:{
            type:String,
            required:true,
        },
        
        sport:{
            type:String,
            required:true,
        },
        status:{
            type:String,
            enum:["Uploaded","Processing","Completed","Failed"],
            default:"Uploaded",
        },
    },
    {
        timestamps:true,
    }
);

module.exports=mongoose.model("Video",videoSchema);