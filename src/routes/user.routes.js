import { Router } from "express";
import { registerUser, loginUser, logoutuser, refreshTokenaccess, changepass, getCurrentUser, avatarChange, getUserProfile, watchistory } from "../controllers/register.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([{
        name:"avatar",
        maxCount:1,
    },{
        name:"coverImage",
        maxCount:1,
    }])
    ,registerUser)

router.route("/login").post(loginUser);  

router.route("/logout").post( verifyJWT,logoutuser)
router.route("/refresh-token").post(refreshTokenaccess)
router.route("/changePassword").post(verifyJWT ,changepass)
router.route("/currentuser").get(verifyJWT,getCurrentUser)
router.route("/avatarchanging").post(verifyJWT, upload.single("avatar"),avatarChange)
router.route("/C/:username").get(verifyJWT,getUserProfile)
router.route("/history").get(verifyJWT,watchistory)

export default router