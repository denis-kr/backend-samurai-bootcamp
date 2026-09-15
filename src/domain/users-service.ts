import { usersRepository } from "../repositories/users-repo.js";
import type { FindAllUsersParams } from "../repositories/users-repo.js";
import bcrypt from "bcrypt";

export const usersService = {
  async findAllUsers(params: FindAllUsersParams) {
    const totalCount = await usersRepository.getTotalCount({
      searchLoginTerm: params.searchLoginTerm,
      searchEmailTerm: params.searchEmailTerm,
    });
    const items = await usersRepository.findAll(params);

    return { items, totalCount };
  },
  async findUserById(id: string) {
    return usersRepository.findById(id);
  },
  async deleteUserById(id: string) {
    return usersRepository.deleteById(id);
  },
  async addNewUser(login: string, password: string, email: string) {
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await this._generatePasswordHash(
      password,
      passwordSalt,
    );

    const newUser = {
      userName: login,
      email,
      passwordHash,
      passwordSalt,
      createdAt: new Date(),
    };
    return usersRepository.create(newUser);
  },
  async _generatePasswordHash(password: string, passwordSalt: string) {
    return bcrypt.hash(password, passwordSalt);
  },
  async checkCredentials(loginOrEmail: string, password: string) {
    const user =
      (await usersRepository.findByLogin(loginOrEmail)) ||
      (await usersRepository.findByEmail(loginOrEmail));

    if (!user) {
      return false;
    }

    const passwordHash = await this._generatePasswordHash(
      password,
      user.passwordSalt,
    );

    if (passwordHash === user.passwordHash) {
      return true;
    }
    return false;
  },
};
