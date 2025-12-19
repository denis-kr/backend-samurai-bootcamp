import { type Post } from "./../repositories/posts-repo.js";
import express, { Router, type Response } from "express";
import { basicAuthMiddleware } from "../middleware/auth/basic.js";
import { createUpdateBodyValidationMiddleware } from "../middleware/validation/validation-posts.js";
import { sendErrorsIfAnyMiddleware } from "../middleware/validation/validation-universal.js";
import type {
  RequestWithBody,
  RequestWithParamsAndBody,
} from "../utils/types.js";
import { postsService } from "../domain/posts-service.js";

const router: Router = express.Router();

//get all posts
router.get("/", async (_, res) => {
  const posts = await postsService.findAllPosts();
  return res.send(
    posts.map((post) => ({ ...post, id: post._id.toString(), _id: undefined }))
  );
});

//get post by id
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const post = await postsService.findPostById(id);
  if (post) {
    return res
      .status(200)
      .json({ ...post, id: post._id.toString(), _id: undefined });
  } else {
    return res.sendStatus(404);
  }
});

router.use(basicAuthMiddleware);

//add new post
router.post(
  "/",
  createUpdateBodyValidationMiddleware,
  sendErrorsIfAnyMiddleware,
  async (
    req: RequestWithBody<{
      title: string;
      shortDescription: string;
      content: string;
      blogId: string;
      blogName: string;
    }>,
    res: Response
  ) => {
    const { title, shortDescription, content, blogId, blogName } = req.body;

    const post: Post = {
      title,
      shortDescription,
      content,
      blogId,
      blogName,
    };
    const insertedId = await postsService.createPost(post);

    const createdPost = await postsService.findPostById(insertedId);

    if (!createdPost) return res.sendStatus(500);

    return res
      .status(201)
      .json({ ...createdPost, id: createdPost._id.toString(), _id: undefined });
  }
);

//update post by id
router.put(
  "/:id",
  createUpdateBodyValidationMiddleware,
  sendErrorsIfAnyMiddleware,
  async (
    req: RequestWithParamsAndBody<
      { id: string },
      {
        title: string;
        shortDescription: string;
        content: string;
        blogId: string;
        blogName: string;
      }
    >,
    res: Response
  ) => {
    const id: string = req.params.id;
    const { title, shortDescription, content, blogId, blogName } = req.body;

    const isUpdated = await postsService.updatePost(id, {
      title,
      shortDescription,
      content,
      blogId,
      blogName,
    });

    if (isUpdated) {
      return res.sendStatus(204);
    } else {
      return res.sendStatus(404);
    }
  }
);

//delete post by id
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const post = await postsService.findPostById(id);
  if (!post) {
    return res.sendStatus(404);
  }

  const isDeleted = await postsService.deletePostById(id);

  if (isDeleted) {
    return res.sendStatus(204);
  } else {
    return res.sendStatus(500);
  }
});

export default router;
