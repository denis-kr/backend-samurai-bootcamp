import express from "express";
import type { Express, Response } from "express";
import blogsRouter from "./routes/blogs-router.js";
import postsRouter from "./routes/posts-router.js";
import { blogsRepository } from "./repositories/blogs-repo.js";
import { postsRepository } from "./repositories/posts-repo.js";

export const app: Express = express();

app.use(express.json());
app.use("/blogs", blogsRouter);
app.use("/posts", postsRouter);

app.delete("/testing/all-data", async (_, res: Response) => {
  await blogsRepository.deleteAll();
  await postsRepository.deleteAll();
  res.sendStatus(204);
});
