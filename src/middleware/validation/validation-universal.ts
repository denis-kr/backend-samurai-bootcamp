import { validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

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
