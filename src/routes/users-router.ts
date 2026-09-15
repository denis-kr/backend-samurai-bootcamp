import express, { Router, type Response } from "express";
import {
  paginationValidationMiddleware,
  sendErrorsIfAnyMiddleware,
} from "../middleware/validation/validation-universal.js";
import type {
  RequestWithQuery,
  RequestWithParams,
  RequestWithBody,
} from "../utils/types.js";
import { usersService } from "../domain/users-service.js";
import { createNewUserValidationMiddleware } from "../middleware/validation/validation-users.js";
import { basicAuthMiddleware } from "../middleware/auth/basic.js";

const router: Router = express.Router();

router.use(basicAuthMiddleware);

router.get(
  "/",
  paginationValidationMiddleware,
  sendErrorsIfAnyMiddleware,
  async (
    req: RequestWithQuery<{
      pageSize?: number;
      pageNumber?: number;
      sortBy?: string;
      sortDirection?: "asc" | "desc";
      searchLoginTerm?: string;
      searchEmailTerm?: string;
    }>,
    res: Response,
  ) => {
    const {
      pageSize: pageSizeQuery = 10,
      pageNumber: pageNumberQuery = 1,
      searchLoginTerm = null,
      searchEmailTerm = null,
      sortDirection = "desc",
      sortBy = "createdAt",
    } = req.query;
    const pageSize = Number(pageSizeQuery) || 10;
    const pageNumber = Number(pageNumberQuery) || 1;

    const users = await usersService.findAllUsers({
      pageSize,
      pageNumber,
      searchLoginTerm,
      searchEmailTerm,
      sortDirection,
      sortBy,
    });

    const totalCount = users.totalCount;
    return res.status(200).json({
      pagesCount: Math.ceil(totalCount / (pageSize || 10)),
      page: pageNumber,
      pageSize,
      totalCount: totalCount,
      items: users.items.map((user) => ({
        login: user.userName,
        email: user.email,
        createdAt: user.createdAt,
        id: user._id.toString(),
        _id: undefined,
      })),
    });
  },
);

router.post(
  "/",
  createNewUserValidationMiddleware,
  sendErrorsIfAnyMiddleware,
  async (
    req: RequestWithBody<{ login: string; password: string; email: string }>,
    res: Response,
  ) => {
    const { login, password, email } = req.body;
    const newUserId = await usersService.addNewUser(login, password, email);

    const newUser = await usersService.findUserById(newUserId);
    if (!newUser) {
      return res.sendStatus(500);
    }

    return res.status(201).json({
      login: newUser.userName,
      email: newUser.email,
      createdAt: newUser.createdAt,
      id: newUser._id.toString(),
      _id: undefined,
    });
  },
);

router.delete(
  "/:id",
  async (req: RequestWithParams<{ id: string }>, res: Response) => {
    const { id } = req.params;

    const user = await usersService.findUserById(id);
    if (!user) {
      return res.sendStatus(404);
    }

    const isDeleted = await usersService.deleteUserById(id);
    if (isDeleted) {
      return res.sendStatus(204);
    }
    return res.sendStatus(500);
  },
);

export default router;
