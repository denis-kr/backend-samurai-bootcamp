import { validationResult, query, param } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export const idValidationMiddleware = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("id is required")
    .isString()
    .withMessage("id must be a string"),
];

export const paginationValidationMiddleware = [
  query("pageSize")
    .optional()
    .isInt({ min: 1 })
    .withMessage("pageSize must be a positive integer")
    .toInt()
    .default(10),
  query("pageNumber")
    .optional()
    .isInt({ min: 1 })
    .withMessage("pageNumber must be a positive integer")
    .toInt()
    .default(1),
  query("sortBy")
    .optional()
    .isString()
    .withMessage("sortBy must be a string")
    .default("createdAt"),
  query("sortDirection")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortDirection must be either 'asc' or 'desc'")
    .default("desc"),
];

export const sendErrorsIfAnyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = validationResult(req);

  const errorsMessages = result
    .array({ onlyFirstError: true })
    .map((error) => ({
      message: error.msg,
      // @ts-ignore
      field: error.path,
    }));

  if (errorsMessages.length > 0) {
    return res.status(400).json({ errorsMessages });
  }

  return next();
};
