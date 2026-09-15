import { body } from "express-validator";

export const commentsValidationMiddleware = [
  body("content")
    .isString()
    .withMessage("Content must be a string")
    .notEmpty()
    .isLength({ min: 20, max: 300 }),
];
