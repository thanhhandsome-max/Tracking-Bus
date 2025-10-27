import express from "express";
import AuthController from "../../controllers/AuthController.js";
import AuthMiddleware from "../../middlewares/AuthMiddleware.js";

const router = express.Router();

// POST /api/auth/register - Đăng ký tài khoản mới
router.post("/register", AuthController.register);

// POST /api/auth/login - Đăng nhập
router.post("/login", AuthController.login);

// POST /api/auth/logout - Đăng xuất
router.post("/logout", AuthMiddleware.authenticate, AuthController.logout);

// GET /api/auth/profile - Lấy thông tin profile
router.get("/profile", AuthMiddleware.authenticate, AuthController.getProfile);

// PUT /api/auth/profile - Cập nhật profile
router.put(
  "/profile",
  AuthMiddleware.authenticate,
  AuthController.updateProfile
);

// PUT /api/auth/change-password - Đổi mật khẩu
router.put(
  "/change-password",
  AuthMiddleware.authenticate,
  AuthController.changePassword
);

// POST /api/auth/forgot-password - Quên mật khẩu
router.post("/forgot-password", AuthController.forgotPassword);

// POST /api/auth/reset-password - Reset mật khẩu
router.post("/reset-password", AuthController.resetPassword);

// POST /api/auth/refresh-token - Refresh token
router.post(
  "/refresh-token",
  AuthMiddleware.authenticate,
  AuthController.refreshToken
);

export default router;
