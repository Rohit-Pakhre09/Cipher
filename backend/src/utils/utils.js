import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

    res.cookie("jwt", accessToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        httpOnly: true,
        sameSite: "none",
        secure: process.env.NODE_ENV !== "development"
    });

    return { accessToken, refreshToken };
};
