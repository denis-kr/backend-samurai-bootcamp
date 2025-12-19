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

export const blogsRepository = {
  async findById(id: string) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return blogs.findOne({ _id: new ObjectId(id) });
  },
  async findAll() {
    return blogs.find().toArray();
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
      { $set: blog }
    );
    return result.matchedCount === 1;
  },
  async deleteAll() {
    await blogs.drop();
  },
};
