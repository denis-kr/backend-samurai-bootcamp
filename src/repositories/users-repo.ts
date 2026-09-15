import { users } from "./db.js";
import { ObjectId } from "mongodb";

export type User = {
  login: string;
  email: string;
  createdAt: Date;
};

export type FindAllUsersParams = {
  pageSize: number;
  pageNumber: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
  searchLoginTerm: string | null;
  searchEmailTerm: string | null;
};

export const usersRepository = {
  //TODO fix type any
  async create(user: any) {
    const result = await users.insertOne(user);
    return result.insertedId?.toString();
  },
  async findById(id: string) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return users.findOne({ _id: new ObjectId(id) });
  },
  async getTotalCount(fields?: {
    searchLoginTerm?: string | null;
    searchEmailTerm?: string | null;
  }) {
    const searchFilters = [];
    if (fields?.searchLoginTerm) {
      searchFilters.push({
        login: { $regex: fields.searchLoginTerm, $options: "i" },
      });
    }
    if (fields?.searchEmailTerm) {
      searchFilters.push({
        email: { $regex: fields.searchEmailTerm, $options: "i" },
      });
    }
    const query = searchFilters.length ? { $or: searchFilters } : {};
    return users.countDocuments(query);
  },
  async findByLogin(login: string) {
    return users.findOne({ login });
  },
  async findByEmail(email: string) {
    return users.findOne({ email });
  },
  findAll({
    pageSize,
    pageNumber,
    sortBy,
    sortDirection,
    searchLoginTerm,
    searchEmailTerm,
  }: FindAllUsersParams) {
    const skip = pageSize && pageNumber ? (pageNumber - 1) * pageSize : 0;
    const limit = pageSize || 0;
    const sort: any = {};
    if (sortBy && sortDirection) {
      sort[sortBy] = sortDirection;
    }

    const searchFilters = [];
    if (searchLoginTerm) {
      searchFilters.push({ login: { $regex: searchLoginTerm, $options: "i" } });
    }
    if (searchEmailTerm) {
      searchFilters.push({ email: { $regex: searchEmailTerm, $options: "i" } });
    }
    const query = searchFilters.length ? { $or: searchFilters } : {};

    return users.find(query).sort(sort).skip(skip).limit(limit).toArray();
  },
  async deleteById(id: string) {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const result = await users.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  },
  async deleteAll() {
    await users.drop();
  },
};
