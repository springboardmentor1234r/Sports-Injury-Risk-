const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt=require("jsonwebtoken");



const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required.",
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists.",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
        });

        // Save user to MongoDB
        await user.save();

        // Send success response
        return res.status(201).json({
            success: true,
            message: "User registered successfully!",
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};


const loginUser = async (req, res) => {
    try{
        const {email,password}=req.body;
        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json({
                success:false,
                message:"Invalid email or password"
        });}
        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({
                success:false,
                message:"Invalid email or password",
            })
        }
        const token=jwt.sign({
            id:user._id,
            role:user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn:"1d",
            }
        );
        return res.status(200).json({
            success:true,
            message:"Login successful",
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                role:user.role,
            },
        });
         
    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:"Server Error"
        });

    }
   
};

// Export Controllers
module.exports = {
    registerUser,
    loginUser,
};