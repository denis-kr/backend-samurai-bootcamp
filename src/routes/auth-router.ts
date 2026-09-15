import express, { Router, type Response } from "express";
import { loginValidationMiddleware } from "../middleware/validation/validation-users.js";
import { sendErrorsIfAnyMiddleware } from "../middleware/validation/validation-universal.js";
import type { RequestWithBody } from "../utils/types.js";
import { usersService } from "../domain/users-service.js";

const router: Router = express.Router();

router.post(
  "/login",
  loginValidationMiddleware,
  sendErrorsIfAnyMiddleware,
  async (
    req: RequestWithBody<{ loginOrEmail: string; password: string }>,
    res: Response,
  ) => {
    const { password, loginOrEmail } = req.body;

    const checkResult = await usersService.checkCredentials(
      loginOrEmail,
      password,
    );

    if (checkResult) {
      res.sendStatus(204);
    } else {
      res.sendStatus(401);
    }
  },
);

export default router;
