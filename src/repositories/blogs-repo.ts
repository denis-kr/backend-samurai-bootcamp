import { blogs } from "./db.js";
import { ObjectId } from "mongodb";

export type Blog = {
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  //TODO this won't be optional in the future
  isMembership?: boolean;
};

export type FindAllBlogsParams = {
  pageSize: number;
  pageNumber: number;
  searchNameTerm: string | null;
  sortDirection: "asc" | "desc";
  sortBy: string;
};

export const blogsRepository = {
  async findById(id: string) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return blogs.findOne({ _id: new ObjectId(id) });
  },
  async getTotalCount() {
    return blogs.countDocuments();
  },
  async findAll({
    pageSize,
    pageNumber,
    searchNameTerm,
    sortDirection,
    sortBy,
  }: FindAllBlogsParams) {
    const skip = pageSize && pageNumber ? (pageNumber - 1) * pageSize : 0;
    const limit = Number(pageSize) || 0;
    const query = searchNameTerm
      ? { name: { $regex: searchNameTerm, $options: "i" } }
      : {};
    const sortQuery =
      sortBy && sortDirection ? { [sortBy]: sortDirection } : {};
    return blogs.find(query).sort(sortQuery).skip(skip).limit(limit).toArray();
  },
  async create(blog: Blog) {
    const result = await blogs.insertOne(blog);
    return result.insertedId.toString();
  },
  async deleteById(id: string) {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const result = await blogs.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  },
  async updateById(id: string, blog: Omit<Blog, "createdAt" | "isMembership">) {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const result = await blogs.updateOne(
      { _id: new ObjectId(id) },
      { $set: blog },
    );
    return result.matchedCount === 1;
  },
  async deleteAll() {
    await blogs.drop();
  },
};
