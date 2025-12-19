import { body } from "express-validator";
import { blogsRepository } from "../../repositories/blogs-repo.js";

export const createUpdateBodyValidationMiddleware = [
  body("shortDescription")
    .trim()
    .notEmpty()
    .withMessage("Short description is required")
    .isString()
    .withMessage("Short description must be a string")
    .isLength({ max: 100 })
    .withMessage("Short description must not exceed 100 characters"),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ max: 30 })
    .withMessage("Title must not exceed 30 characters"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isString()
    .withMessage("Content must be a string")
    .isLength({ max: 1000 })
    .withMessage("Content must not exceed 1000 characters"),
  body("blogId")
    .trim()
    .notEmpty()
    .withMessage("Blog ID is required")
    .isString()
    .withMessage("Blog ID must be a string")
    .custom(async (value, { req }) => {
      const blog = await blogsRepository.findById(value);

      if (!blog) {
        throw new Error("Invalid blog Id");
      }

      req.body.blogName = blog.name;
    })
    .withMessage("Invalid value"),
];
