import {Router} from 'express';
import {registerUser} from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js';

const router = Router()

router.route("/register").post(
  upload.fields(
    [
      {
        name: "avatar",           //when data is sent from the frontend, the name has to match with this
        maxCount: 1
      },
      {
        name: "coverImage",
        maxCount: 1
      }
    ]
  ),
  registerUser
)



export default router