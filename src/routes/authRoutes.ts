import express from 'express'
const router = express.Router()

import {
    loginUser,
    registerNewUser
} from '../controllers/authController.js'

router.post('/register', registerNewUser)
router.post('/login', loginUser)


export default router