import express, { Router, type Response } from "express";
import { commentsValidationMiddleware } from "../middleware/validation/validation-comments.js";
import { sendErrorsIfAnyMiddleware } from "../middleware/validation/validation-universal.js";
import { authMiddleware } from "../middleware/auth/auth-middleware.js";
import { commentsService } from "../domain/comments-service.js";
import type {
  RequestWithParams,
  RequestWithParamsAndBody,
} from "../utils/types.js";

const router: Router = express.Router();

router.get(
  "/:id",
  async (req: RequestWithParams<{ id: string }>, res: Response) => {
    const comment = await commentsService.findCommentById(req.params.id);
    if (!comment) {
      return res.sendStatus(404);
    }

    return res.status(200).json({
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: comment.commentatorInfo,
      createdAt: comment.createdAt,
    });
  },
);

router.use(authMiddleware);

router.put(
  "/:commentId",
  commentsValidationMiddleware,
  sendErrorsIfAnyMiddleware,
  async (
    req: RequestWithParamsAndBody<{ commentId: string }, { content: string }>,
    res: Response,
  ) => {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await commentsService.findCommentById(commentId);
    if (!comment) {
      return res.sendStatus(404);
    }

    if (comment.commentatorInfo.userId !== req.userId) {
      return res.sendStatus(403);
    }

    const isUpdated = await commentsService.updateComment(commentId, content);
    if (isUpdated) {
      return res.sendStatus(204);
    } else {
      return res.sendStatus(404);
    }
  },
);

router.delete(
  "/:commentId",
  async (req: RequestWithParams<{ commentId: string }>, res: Response) => {
    const { commentId } = req.params;

    const comment = await commentsService.findCommentById(commentId);
    if (!comment) {
      return res.sendStatus(404);
    }

    if (comment.commentatorInfo.userId !== req.userId) {
      return res.sendStatus(403);
    }

    const isDeleted = await commentsService.deleteCommentById(commentId);
    if (isDeleted) {
      return res.sendStatus(204);
    } else {
      return res.sendStatus(404);
    }
  },
);

export default router;
