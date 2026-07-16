import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import validator from "validator"
import crypto from "crypto"
import { OAuth2Client } from "google-auth-library"
import { ADMIN_PANEL_ROLES, STAFF_MANAGEABLE_ROLES, USER_ROLES } from "../constants/roles.js"
import { sendCustomerRegistrationEmail } from "../utils/loginEmail.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const normalizeRole = (role) => {
    if (role === USER_ROLES.STAFF) {
        return USER_ROLES.MANAGEMENT_STAFF;
    }
    return role;
}

const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: normalizeRole(user.role),
    profileImage: getProfileImageUrl(user.profileImage),
    avatar: buildAvatarUrl(user.email),
});

const mapGoogleAuthError = (error) => {
    const rawMessage = String(error?.message || "");
    const message = rawMessage.toLowerCase();

    if (!rawMessage) {
        return "Google login failed. Unknown OAuth error.";
    }

    if (message.includes("wrong recipient") || message.includes("audience") || message.includes("aud")) {
        return "Google client ID mismatch. Use the same client ID in frontend VITE_GOOGLE_CLIENT_ID and backend GOOGLE_CLIENT_ID.";
    }

    if (message.includes("deleted_client")) {
        return "Google OAuth client was deleted. Create a new Web Client ID and update frontend/backend env values.";
    }

    if (message.includes("invalid token") || message.includes("malformed")) {
        return "Google returned an invalid token. Please try again.";
    }

    if (message.includes("origin") || message.includes("not allowed") || message.includes("unauthorized")) {
        return "Google OAuth origin is not allowed. Add your frontend URL to Authorized JavaScript origins in Google Cloud Console.";
    }

    return `Google login failed: ${rawMessage}`;
}


const createToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET)
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildAvatarUrl = (email) => {
    const normalizedEmail = (email || "").trim().toLowerCase();
    const hash = crypto.createHash("md5").update(normalizedEmail).digest("hex");
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=128`;
}

const getProfileImageUrl = (profileImage) => {
    if (!profileImage) return "";
    if (profileImage.startsWith("http://") || profileImage.startsWith("https://")) {
        return profileImage;
    }
    return `/images/${profileImage}`;
}

const buildUsernameBase = (name, email) => {
    const fallback = (email || "customer").split("@")[0] || "customer";
    const source = (name || fallback).toLowerCase();
    const cleaned = source.replace(/[^a-z0-9]/g, "");
    return cleaned || "customer";
}

const createUniqueUsername = async (name, email) => {
    const base = buildUsernameBase(name, email);
    let username = base;
    let counter = 0;

    while (await userModel.findOne({ username })) {
        counter += 1;
        username = `${base}${counter}`;
    }

    return username;
}

 
const getUserProfile = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const user = await userModel.findById(userId).select("name username email role profileImage");

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}


const updateUserProfile = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        if (!userId) {
            return res.json({ success: false, message: "Not Authorized Login Again" });
        }
        const {
            name,
            username,
            email,
            password,
        } = req.body;
        const uploadedImage = req.file?.filename || "";

        const currentUser = await userModel.findById(userId);

        if (!currentUser) {
            return res.json({ success: false, message: "User not found" });
        }

        const normalizedName = (name || currentUser.name).trim();
        const normalizedUsername = (username || currentUser.username).trim().toLowerCase();
        const normalizedEmail = (email || currentUser.email).trim().toLowerCase();

        if (!normalizedName || !normalizedUsername || !normalizedEmail) {
            return res.json({ success: false, message: "Please fill all required fields" });
        }

        if (!validator.isEmail(normalizedEmail)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        const usernameExists = await userModel.findOne({
            username: normalizedUsername,
            _id: { $ne: userId },
        });

        if (usernameExists) {
            return res.json({ success: false, message: "Username already exists" });
        }

        const emailExists = await userModel.findOne({
            email: normalizedEmail,
            _id: { $ne: userId },
        });

        if (emailExists) {
            return res.json({ success: false, message: "Email already exists" });
        }

        currentUser.name = normalizedName;
        currentUser.username = normalizedUsername;
        currentUser.email = normalizedEmail;

        if (uploadedImage) {
            currentUser.profileImage = uploadedImage;
        }

        if (password && password.trim()) {
            if (password.trim().length < 6) {
                return res.json({ success: false, message: "Password must be at least 6 characters" });
            }

            const salt = await bcrypt.genSalt(10);
            currentUser.password = await bcrypt.hash(password.trim(), salt);
        }

        await currentUser.save();

        res.json({
            success: true,
            user: sanitizeUser(currentUser),
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error?.message || "Error" });
    }
}


const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const loginIdentifier = (username || "").trim();

        if (!loginIdentifier || !password) {
            return res.json({ success: false, message: "Please enter username and password" });
        }

        const user = await userModel.findOne({
            $or: [
                { username: { $regex: `^${escapeRegex(loginIdentifier)}$`, $options: "i" } },
                { email: loginIdentifier.toLowerCase() },
            ],
        });

        if (!user) {
            return res.json({ success: false, message: "User doesn't exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = createToken(user._id);

        res.json({
            success: true,
            token,
            user: sanitizeUser(user),
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}


const registerUser = async (req, res) => {
    const { name, email, username, password } = req.body;
    try {
        const normalizedName = (name || "").trim();
        const normalizedEmail = (email || "").trim().toLowerCase();
        const normalizedUsername = (username || "").trim().toLowerCase();

        if (!normalizedName || !normalizedEmail || !normalizedUsername || !password) {
            return res.json({ success: false, message: "Please fill all required fields" });
        }

      
        const exists = await userModel.findOne({
            $or: [{ username: normalizedUsername }, { email: normalizedEmail }]
        });

        if (exists) {
            return res.json({ success: false, message: "Username or email already exists" });
        }

        if (!validator.isEmail(normalizedEmail)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

      
        if (password.length < 6) {
            return res.json({ success: false, message: "Password must be at least 6 characters" });
        }

      
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name: normalizedName,
            email: normalizedEmail,
            username: normalizedUsername,
            password: hashedPassword,
            role: USER_ROLES.CUSTOMER
        });

        const user = await newUser.save();

        let emailStatus = "sent";
        try {
            await sendCustomerRegistrationEmail({
                name: user.name,
                email: user.email,
            });
        } catch (emailError) {
            emailStatus = `error: ${emailError?.message || emailError}`;
            console.error("Failed to send registration email:", emailError?.message || emailError);
        }

        const token = createToken(user._id);

        res.json({
            success: true,
            token,
            user: sanitizeUser(user),
            emailStatus,
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}


const googleLoginUser = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.json({ success: false, message: "Google auth is not configured on server" });
        }

        if (!credential) {
            return res.json({ success: false, message: "Google credential is required" });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.json({ success: false, message: "Invalid Google account payload" });
        }

        const email = payload.email.toLowerCase();
        const name = payload.name || "Google User";
        const avatar = payload.picture || buildAvatarUrl(email);

        let user = await userModel.findOne({ email });

        if (user && user.role !== "customer") {
            return res.json({ success: false, message: "Google login is only available for customer accounts" });
        }

        let createdNow = false;

        if (!user) {
            const username = await createUniqueUsername(name, email);
            const randomPassword = crypto.randomBytes(24).toString("hex");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            const newUser = new userModel({
                name,
                email,
                username,
                password: hashedPassword,
                role: USER_ROLES.CUSTOMER,
            });

            user = await newUser.save();
            createdNow = true;
        }

        const token = createToken(user._id);

        if (createdNow && user.role === USER_ROLES.CUSTOMER) {
            sendCustomerRegistrationEmail({
                name: user.name,
                email: user.email,
            }).catch((emailError) => {
                console.error("Failed to send registration email:", emailError?.message || emailError);
            });
        }

        return res.json({
            success: true,
            token,
            user: {
                ...sanitizeUser(user),
                avatar,
            },
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: mapGoogleAuthError(error) });
    }
}

const listStaffUsers = async (req, res) => {
    try {
        const users = await userModel
            .find({ role: { $in: ADMIN_PANEL_ROLES } })
            .sort({ createdAt: -1 })
            .select("name username email role profileImage");

        res.json({
            success: true,
            users: users.map((user) => ({
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: normalizeRole(user.role),
                profileImage: getProfileImageUrl(user.profileImage),
            })),
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const createStaffUser = async (req, res) => {
    try {
        const { name, email, username, password, role } = req.body;

        const normalizedName = (name || "").trim();
        const normalizedEmail = (email || "").trim().toLowerCase();
        const normalizedUsername = (username || "").trim().toLowerCase();
        const normalizedRole = (role || "").trim().toLowerCase();

        if (!normalizedName || !normalizedEmail || !normalizedUsername || !password || !normalizedRole) {
            return res.json({ success: false, message: "Please fill all required fields" });
        }

        if (!STAFF_MANAGEABLE_ROLES.includes(normalizedRole)) {
            return res.json({ success: false, message: "Invalid role" });
        }

        if (!validator.isEmail(normalizedEmail)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (password.length < 6) {
            return res.json({ success: false, message: "Password must be at least 6 characters" });
        }

        const exists = await userModel.findOne({
            $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
        });

        if (exists) {
            return res.json({ success: false, message: "Username or email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await userModel.create({
            name: normalizedName,
            email: normalizedEmail,
            username: normalizedUsername,
            password: hashedPassword,
            role: normalizedRole,
        });

        res.json({
            success: true,
            message: "Staff user created",
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const updateStaffUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, username, password, role } = req.body;

        const user = await userModel.findById(id);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (user.role === USER_ROLES.ADMIN) {
            return res.json({ success: false, message: "Admin user cannot be modified from this endpoint" });
        }

        const normalizedRole = role ? role.trim().toLowerCase() : user.role;
        if (!STAFF_MANAGEABLE_ROLES.includes(normalizedRole)) {
            return res.json({ success: false, message: "Invalid role" });
        }

        if (name && name.trim()) {
            user.name = name.trim();
        }

        if (username && username.trim()) {
            const normalizedUsername = username.trim().toLowerCase();
            const usernameExists = await userModel.findOne({
                username: normalizedUsername,
                _id: { $ne: id },
            });

            if (usernameExists) {
                return res.json({ success: false, message: "Username already exists" });
            }

            user.username = normalizedUsername;
        }

        if (email && email.trim()) {
            const normalizedEmail = email.trim().toLowerCase();

            if (!validator.isEmail(normalizedEmail)) {
                return res.json({ success: false, message: "Please enter a valid email" });
            }

            const emailExists = await userModel.findOne({
                email: normalizedEmail,
                _id: { $ne: id },
            });

            if (emailExists) {
                return res.json({ success: false, message: "Email already exists" });
            }

            user.email = normalizedEmail;
        }

        if (password && password.trim()) {
            if (password.trim().length < 6) {
                return res.json({ success: false, message: "Password must be at least 6 characters" });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password.trim(), salt);
        }

        user.role = normalizedRole;
        await user.save();

        res.json({
            success: true,
            message: "Staff user updated",
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const deleteStaffUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel.findById(id);

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (user.role === USER_ROLES.ADMIN) {
            return res.json({ success: false, message: "Admin user cannot be deleted" });
        }

        await userModel.findByIdAndDelete(id);
        res.json({ success: true, message: "Staff user deleted" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const countCustomers = async (req, res) => {
    try {
        const count = await userModel.countDocuments({ role: USER_ROLES.CUSTOMER });
        res.json({ success: true, count });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

export {
    loginUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
    googleLoginUser,
    listStaffUsers,
    createStaffUser,
    updateStaffUser,
    deleteStaffUser,
    countCustomers,
};