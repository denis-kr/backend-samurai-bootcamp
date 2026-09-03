// import { users } from "./db.js";
// import { ObjectId } from "mongodb";

// //TODO
// // export type User = {
// //   login: string;
// //   email: string;
// //   createdAt: Date;
// // };

// export const usersRepository = {
//   async create(user: User) {
//     const result = await users.insertOne(user);
//     return result.insertedId.toString();
//   },
//   findAll({
//     pageSize,
//     pageNumber,
//     sortBy,
//     sortDirection,
//     searchLoginTerm,
//     searchEmailTerm,
//   }) {
//     const skip = pageSize && pageNumber ? (pageNumber - 1) * pageSize : 0;
//     const limit = pageSize || 0;
//     const sort: any = {};
//     if (sortBy && sortDirection) {
//       sort[sortBy] = sortDirection;
//     }

//     return users.find().sort(sort).skip(skip).limit(limit).toArray();
//   },
//   async deleteById(id: string) {
//     if (!ObjectId.isValid(id)) {
//       return false;
//     }
//     const result = await users.deleteOne({ _id: new ObjectId(id) });
//     return result.deletedCount === 1;
//   },
//   async deleteAll() {
//     await users.drop();
//   },
// };
