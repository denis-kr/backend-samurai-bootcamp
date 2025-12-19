import express, { Router, type Response } from "express";
import { blogsService } from "../domain/blogs-service.js";
import { createUpdateBodyValidationMiddleware } from "../middleware/validation/validation-blogs.js";
import { sendErrorsIfAnyMiddleware } from "../middleware/validation/validation-universal.js";
import { basicAuthMiddleware } from "../middleware/auth/basic.js";
import type {
  RequestWithParamsAndBody,
  RequestWithBody,
  RequestWithParams,
} from "../utils/types.js";
import type { Blog } from "../repositories/blogs-repo.js";

const router: Router = express.Router();

// get all blogs
router.get("/", async (_, res) => {
  const blogs = await blogsService.findAllBlogs();
  return res.status(200).json(
    blogs.map((blog) => ({
      ...blog,
      id: blog._id.toString(),
      _id: undefined,
    }))
  );
});

// get blog by id
router.get(
  "/:id",
  async (req: RequestWithParams<{ id: string }>, res: Response) => {
    const id = req.params.id;
    const blog = await blogsService.findBlogById(id);
    if (blog) {
      return res
        .status(200)
        .json({ ...blog, id: blog._id.toString(), _id: undefined });
    } else {
      res.sendStatus(404);
    }
  }
);

router.use(basicAuthMiddleware);

//add new blog
router.post(
  "/",
  createUpdateBodyValidationMiddleware,
  sendErrorsIfAnyMiddleware,
  async (
    req: RequestWithBody<{
      name: string;
      description: string;
      websiteUrl: string;
    }>,
    res: Response
  ) => {
    const { name, description, websiteUrl } = req.body;

    const blog: Omit<Blog, "createdAt" | "isMembership"> = {
      name,
      description,
      websiteUrl,
    };
    const createdId = await blogsService.createBlog(blog);

    const createdBlog = await blogsService.findBlogById(createdId);

    if (!createdBlog) return res.sendStatus(500);

    return res
      .status(201)
      .json({ ...createdBlog, id: createdBlog._id.toString(), _id: undefined });
  }
);

//update blog by id
router.put(
  "/:id",
  createUpdateBodyValidationMiddleware,
  sendErrorsIfAnyMiddleware,
  async (
    req: RequestWithParamsAndBody<
      { id: string },
      { name: string; description: string; websiteUrl: string }
    >,
    res: Response
  ) => {
    const id = req.params.id;
    const { name, description, websiteUrl } = req.body;

    const isUpdated = await blogsService.updateBlog(id, {
      name,
      description,
      websiteUrl,
    });

    if (isUpdated) {
      return res.sendStatus(204);
    } else {
      return res.sendStatus(404);
    }
  }
);

// Delete blog by id
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const blog = await blogsService.findBlogById(id);
  if (!blog) {
    return res.sendStatus(404);
  }

  const isDeleted = await blogsService.deleteBlogById(id);
  if (isDeleted) {
    return res.sendStatus(204);
  } else {
    return res.sendStatus(500);
  }
});

export default router;
