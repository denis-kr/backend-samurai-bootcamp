import express, { Router, type Response } from "express";
import { loginValidationMiddleware } from "../middleware/validation/validation-users.js";
import { sendErrorsIfAnyMiddleware } from "../middleware/validation/validation-universal.js";
import type { RequestWithBody } from "../utils/types.js";
import { usersService } from "../domain/users-service.js";
import { jwtService } from "../application/jwt-service.js";
import { authMiddleware } from "../middleware/auth/auth-middleware.js";

const router: Router = express.Router();

// router.post("/registration-confirmation", () => {});
// router.post("/registration", () => {});
// router.post("/auth/registration-email-resending", () => {});

router.post(
  "/login",
  loginValidationMiddleware,
  sendErrorsIfAnyMiddleware,
  async (
    req: RequestWithBody<{ loginOrEmail: string; password: string }>,
    res: Response,
  ) => {
    const { password, loginOrEmail } = req.body;

    const user = await usersService.checkCredentials(loginOrEmail, password);

    if (user) {
      const token = await jwtService.createJWT(user);
      res.status(201).send({ accessToken: token });
    } else {
      res.sendStatus(401);
    }
  },
);

router.get("/me", authMiddleware, async (req, res) => {
  const userId = req.userId;

  if (userId) {
    const user = await usersService.findUserById(userId);

    if (user) {
      return res.status(200).json({
        email: user.email,
        login: user.userName,
        userId: user._id.toString(),
      });
    }
  }

  return res.sendStatus(401);
});

export default router;
