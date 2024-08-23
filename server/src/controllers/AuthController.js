import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

const maxAge = 3 * 24 * 60 * 60 * 1000;
const createToken = (email, userId) => {
    return jwt.sign({ email, userId }, process.env.JWT_KEY, {
        expiresIn: maxAge
    })
}

const SignUp = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send("Email and Password is required")
        }
        const user = await User.create({ email, password });
        res.cookie("jwt", createToken(user.email, user.id), {
            maxAge,
            secure: true,
            sameSite: "None"
        })
        return res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                profileSetup: user.profileSetup
            }
        })
    } catch (error) {
        console.log(error);
        return res.status(500).send("Something went wrong")
    }
}

export default {
    SignUp
}