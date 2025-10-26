import express from "express";
import AuthController from "../../controllers/AuthController.js";
import AuthMiddleware from "../../middlewares/AuthMiddleware.js";

const router = express.Router();

//Hoàn thành API: POST /auth/login
router.post("/login", AuthController.login);

// Hoàn thành API: GET /auth/profile 
// Hoàn thành middleware: authenticate
router.get(
  "/profile",
  AuthMiddleware.authenticate, // <-- Gắn middleware vào đây
  AuthController.getProfile
);

export default router;