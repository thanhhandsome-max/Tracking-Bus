import express from "express";
import ReportsController from "../../controllers/ReportsController.js";
import AuthMiddleware from "../../middlewares/AuthMiddleware.js";

const router = express.Router();

router.get(
  "/overview",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("quan_tri"),
  ReportsController.overview
);

export default router;
