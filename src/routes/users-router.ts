// import express, { Router, type Response } from "express";
// import {
//   paginationValidationMiddleware,
//   sendErrorsIfAnyMiddleware,
// } from "../middleware/validation/validation-universal.js";
// import type {
//   RequestWithQuery,
//   RequestWithBody,
//   RequestWithParams,
// } from "../utils/types.js";
// import { usersService } from "../domain/users-service.js";

// const router: Router = express.Router();

// //TODO this will be a diffirent auth, JWT token probably
// // router.use(basicAuthMiddleware);

// router.get(
//   "/",
//   paginationValidationMiddleware,
//   sendErrorsIfAnyMiddleware,
//   async (
//     req: RequestWithQuery<{
//       pageSize?: number;
//       pageNumber?: number;
//       sortBy?: string;
//       sortDirection?: "asc" | "desc";
//       searchLoginTerm?: string;
//       searchEmailTerm?: string;
//     }>,
//     res: Response
//   ) => {
//     const {
//       pageSize = 10,
//       pageNumber = 1,
//       searchLoginTerm = null,
//       searchEmailTerm = null,
//       sortDirection = "desc",
//       sortBy = "createdAt",
//     } = req.query;

//     const users = await usersService.findAllUsers({
//       pageSize,
//       pageNumber,
//       searchLoginTerm,
//       searchEmailTerm,
//       sortDirection,
//       sortBy,
//     });

//     const totalCount = users.totalCount;
//     return res.status(200).json({
//       pagesCount: Math.ceil(totalCount / (pageSize || 10)),
//       page: pageNumber,
//       pageSize,
//       totalCount: totalCount,
//       items: users.items.map((user) => ({
//         ...user,
//         id: user._id.toString(),
//         _id: undefined,
//       })),
//     });
//   }
// );

// router.post(
//   "/",
//   //TODO add express validator testing for here
//   (
//     req: RequestWithBody<{ login: string; password: string; email: string }>,
//     res: Response
//   ) => {
//     const { login, password, email } = req.body;
//     return;
//   }
// );

// router.delete(
//   //TODO need validation for id
//   "/:id",
//   async (req: RequestWithParams<{ id: string }>, res: Response) => {
//     const { id } = req.params;

//     const result = await usersService.deleteUserById(id);
//     if (result) {
//       return res.sendStatus(204);
//     }
//     return res.sendStatus(404);
//   }
// );

// export default router;
