import mongoose from "mongoose";
import { genSalt, hash } from "bcrypt"
const userSchema = new mongoose.Schema({
    email: { type: String, required: [true, "Email is Required"], unique: true },
    password: {
        type: String,
        required: [true, "Password is Required"],
        minlength: [6, "Password must be at least 6 characters"],
        validate: {
            validator: function (v) {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}$/.test(v);
            },
            message: "Password must contain at least one uppercase letter, one special character, and one lowercase letter."
        }
    },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    image: { type: String, required: false },
    color: { type: Number, required: false },
    profileSetup: { type: Boolean, required: false, default: false }
})

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    const salt = await genSalt();
    this.password = await hash(this.password, salt);
    next();
});

const User = mongoose.model("User", userSchema);
export default User