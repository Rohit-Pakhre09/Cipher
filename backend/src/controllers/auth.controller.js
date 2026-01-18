import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../utils/utils.js";
import cloudinary from "../lib/cloudinary.js";
import { sendResetEmail } from "../lib/mailer.js";

const passwordResetCooldowns = new Map();
const COOLDOWN_PERIOD_MS = 5 * 60 * 1000;


export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({ email });

        if (user) return res.status(400).json({ message: "Email already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        });

        if (newUser) {
            const { accessToken, refreshToken } = generateToken(newUser._id, res);
            newUser.refreshToken = refreshToken;
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });
        } else {
            res.status(400).json({ message: "Inavalid User data" });
        }
    } catch (error) {
        console.log("Error in sign controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const { accessToken, refreshToken } = generateToken(user._id, res);
        await User.findByIdAndUpdate(user._id, { refreshToken });

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const logout = async (req, res) => {
    try {
        const userId = req.user._id;
        await User.findByIdAndUpdate(userId, { refreshToken: null });
        res.cookie("jwt", "", { maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;

        if (!profilePic) {
            return res.status(400).json({ message: "Profile pic is required" });
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic)
        const updatedUser = await User.findByIdAndUpdate(userId, { profilePic: uploadResponse.secure_url }, { new: true });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.log("There is some server error: ", error.message);
        res.status(500).json({ message: "There is some server error" });
    }
};


export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await User.findOne({ email });

        
        if (!user) {
            return res.status(200).json({ message: "Password reset email sent!" });
        }

        
        if (passwordResetCooldowns.has(email)) {
            console.log(`Cooldown active for ${email}. Not sending another password reset email yet.`);
            return res.status(200).json({ message: "Password reset email sent!" });
        }

        const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_RESET_SECRET || process.env.JWT_SECRET, { expiresIn: "1h" });
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

        
        passwordResetCooldowns.set(email, true);
        setTimeout(() => {
            passwordResetCooldowns.delete(email);
        }, COOLDOWN_PERIOD_MS);

        
        try {
            if (!process.env.RESEND_API_KEY) {
                console.log("RESEND_API_KEY not set. Skipping email send.");
                
            } else {
                const sendResult = await sendResetEmail(user.email, resetUrl, user.fullName);
                console.log("Password reset email sent to", user.email);
                console.log("Resend response:", sendResult);
            }
        } catch (err) {
            console.log("Failed to send reset email:", err);
            
        }

        res.status(200).json({ message: "Password reset email sent!" });
    } catch (error) {
        console.log("Error in forgotPassword controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token) return res.status(400).json({ message: "Invalid or missing token" });
        if (!password || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

        const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET || process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId, passwordResetToken: token });

        if (!user) return res.status(400).json({ message: "Invalid or expired token" });
        if (user.passwordResetExpires && user.passwordResetExpires < Date.now()) {
            return res.status(400).json({ message: "Token expired" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;

        await user.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.log("Error in resetPassword controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token required" });
        }

        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        if (decoded.userId !== user._id.toString()) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateToken(user._id, res);
        await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

        res.status(200).json({ message: "Token refreshed successfully" });
    } catch (error) {
        console.log("Error in refreshToken controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth constroller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};