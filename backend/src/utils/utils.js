import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "15m"
    });

    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

    res.cookie("jwt", accessToken, {
        maxAge: 60 * 60 * 1000, // 1 hour in MS
        httpOnly: true, // prevent XSS attacks cross-site scripting attacks
        sameSite: "strict", // CSRF attacks cross-site, request forgery attacks
        secure: process.env.NODE_ENV !== "development"
    });

    return { accessToken, refreshToken };
};
