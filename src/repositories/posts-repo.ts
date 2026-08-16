import { posts } from "./db.js";
import { ObjectId } from "mongodb";

export type Post = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
};

export type FindAllPostsParams = {
  pageSize: number;
  pageNumber: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
  blogId?: string;
};

export const postsRepository = {
  async findById(id: string) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return posts.findOne({ _id: new ObjectId(id) });
  },
  async getTotalCount(fields?: { blogId?: string }) {
    const filter = fields?.blogId ? { blogId: fields.blogId } : {};
    return posts.countDocuments(filter);
  },
  async findAll({
    pageSize,
    pageNumber,
    sortBy,
    sortDirection,
    blogId,
  }: FindAllPostsParams) {
    const skip = pageSize && pageNumber ? (pageNumber - 1) * pageSize : 0;
    const limit = pageSize || 0;
    const sort: any = {};
    if (sortBy && sortDirection) {
      sort[sortBy] = sortDirection;
    }
    const filter = blogId ? { blogId } : {};
    return posts.find(filter).sort(sort).skip(skip).limit(limit).toArray();
  },
  async create(post: Post & { createdAt: Date }) {
    const result = await posts.insertOne(post);
    return result.insertedId.toString();
  },
  async deleteById(id: string) {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const result = await posts.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  },
  async updateById(id: string, post: Post) {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const result = await posts.updateOne(
      { _id: new ObjectId(id) },
      { $set: post }
    );
    return result.matchedCount === 1;
  },
  async deleteAll() {
    await posts.drop();
  },
};
