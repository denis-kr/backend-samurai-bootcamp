import { comments } from "./db.js";
import { ObjectId } from "mongodb";

export type Comment = {
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  postId: string;
  createdAt: Date;
};

export type FindAllCommentsParams = {
  postId: string;
  pageSize: number;
  pageNumber: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
};

export const commentsRepository = {
  async create(comment: Comment) {
    const result = await comments.insertOne(comment);
    return result.insertedId.toString();
  },
  async findById(id: string) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return comments.findOne({ _id: new ObjectId(id) });
  },
  async getTotalCount(postId: string) {
    return comments.countDocuments({ postId });
  },
  async findAllByPostId({
    postId,
    pageSize,
    pageNumber,
    sortBy,
    sortDirection,
  }: FindAllCommentsParams) {
    const skip = pageSize && pageNumber ? (pageNumber - 1) * pageSize : 0;
    const limit = pageSize || 0;
    const sort: any = {};
    if (sortBy && sortDirection) {
      sort[sortBy] = sortDirection;
    }
    return comments
      .find({ postId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  },
  async updateById(id: string, content: string) {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const result = await comments.updateOne(
      { _id: new ObjectId(id) },
      { $set: { content } },
    );
    return result.matchedCount === 1;
  },
  async deleteById(id: string) {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const result = await comments.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  },
  async deleteAll() {
    await comments.drop();
  },
};
