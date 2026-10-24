const authService = require('../Services/auth.service')

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const data = await authService.registerUser(name.trim(), normalizedEmail, password);

        return res.status(201).json({
            message: "User Registered Successfully",
            token: data.token,
            user: data.user
        });
    } catch (err) {
        console.error("Register Error:", err.message);

        if (err.message === "EMAIL ALREADY EXISTS") {
            return res.status(409).json({
                message: "Email already exists"
            });
        }
        return res.status(500).json({
            message: "Internal server Error"
        });
    }
}


async function login(req,res){
    try{
        const {email,password}=req.body;

        if(!email || !password){
            return res.status(400).json({
                message:'Email and Password are required'
            })
        }

        const normalizedEmail=email.toLowerCase().trim();
        const data=await authService.loginUser(normalizedEmail,password);

        return res.status(200).json({
            message: 'Login Successful',
            token: data.token,
            user: data.user
        });
    } catch (err) {
        console.error("Login Error:", err.message);

        if (err.message === "Invalid_Credentials") {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
}

module.exports={
    register,
    login
}