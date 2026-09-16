import request from "supertest";
import { app } from "../src/setting.js";
import { authTestManager } from "./utils/auth-manager.js";
import { usersTestManager } from "./utils/users-manager.js";

//The tests have to be isolated and independent.

describe("Auth", () => {
  beforeEach(() => {
    //clear all data before running tests
    return request(app).delete("/testing/all-data");
  });

  const createTestUser = async (
    overrides: { login?: string; password?: string; email?: string } = {},
  ) => {
    const data = {
      login: overrides.login ?? "john_doe",
      password: overrides.password ?? "password1",
      email: overrides.email ?? "john@mail.com",
    };
    await usersTestManager.createUser(data, {
      expectedStatusCode: 201,
      isAuthorized: true,
    });
    return data;
  };

  describe("POST /auth/login", () => {
    //POST /auth/login 201 with login
    it("should return 201 and an accessToken when logging in with a valid login and password", async () => {
      const user = await createTestUser();

      await authTestManager.login(
        { loginOrEmail: user.login, password: user.password },
        { expectedStatusCode: 201 },
      );
    });

    //POST /auth/login 201 with email
    it("should return 201 and an accessToken when logging in with a valid email and password", async () => {
      const user = await createTestUser();

      await authTestManager.login(
        { loginOrEmail: user.email, password: user.password },
        { expectedStatusCode: 201 },
      );
    });

    //POST /auth/login 401 wrong password
    it("should return 401 if the password is incorrect", async () => {
      const user = await createTestUser();

      await authTestManager.login(
        { loginOrEmail: user.login, password: "wrongpassword" },
        { expectedStatusCode: 401 },
      );
    });

    //POST /auth/login 401 unknown loginOrEmail
    it("should return 401 if loginOrEmail does not match any user", async () => {
      await authTestManager.login(
        { loginOrEmail: "nobody", password: "password1" },
        { expectedStatusCode: 401 },
      );
    });

    //POST /auth/login 400 password is missing
    it("should return 400 if password is missing", async () => {
      const user = await createTestUser();

      const response = await authTestManager.login(
        { loginOrEmail: user.login },
        { expectedStatusCode: 400 },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "password" }),
      );
    });

    //POST /auth/login 400 password is an empty string
    it("should return 400 if password is an empty string", async () => {
      const user = await createTestUser();

      const response = await authTestManager.login(
        { loginOrEmail: user.login, password: "" },
        { expectedStatusCode: 400 },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "password" }),
      );
    });

    //POST /auth/login 400 loginOrEmail is missing
    it("should return 400 if loginOrEmail is missing", async () => {
      const response = await authTestManager.login(
        { password: "password1" },
        { expectedStatusCode: 400 },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "loginOrEmail" }),
      );
    });

    //POST /auth/login 400 loginOrEmail is an empty string
    it("should return 400 if loginOrEmail is an empty string", async () => {
      const response = await authTestManager.login(
        { loginOrEmail: "", password: "password1" },
        { expectedStatusCode: 400 },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "loginOrEmail" }),
      );
    });
  });

  describe("GET /auth/me", () => {
    const loginTestUser = async () => {
      const user = await createTestUser();
      const loginResponse = await authTestManager.login(
        { loginOrEmail: user.login, password: user.password },
        { expectedStatusCode: 201 },
      );
      return { user, accessToken: loginResponse.body.accessToken };
    };

    //GET /auth/me 200
    it("should return the current user's email, login and userId for a valid token", async () => {
      const { user, accessToken } = await loginTestUser();

      const response = await authTestManager.me({
        expectedStatusCode: 200,
        authHeader: `Bearer ${accessToken}`,
      });

      expect(response.body.email).toBe(user.email);
      expect(response.body.login).toBe(user.login);
      expect(response.body.userId).toBeDefined();
    });

    //GET /auth/me 401 no Authorization header
    it("should return 401 if no Authorization header is provided", async () => {
      await authTestManager.me({ expectedStatusCode: 401 });
    });

    //GET /auth/me 401 Authorization header has no token
    it("should return 401 if the Authorization header has no token", async () => {
      await authTestManager.me({
        expectedStatusCode: 401,
        authHeader: "Bearer",
      });
    });

    //GET /auth/me 401 invalid token
    it("should return 401 if the token is invalid", async () => {
      await authTestManager.me({
        expectedStatusCode: 401,
        authHeader: "Bearer invalid.token.value",
      });
    });

    //GET /auth/me 401 user referenced by the token has been deleted
    it("should return 401 if the user referenced by the token has been deleted", async () => {
      const created = await usersTestManager.createUser(
        { login: "to_delete", password: "password1", email: "to_delete@mail.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );
      const loginResponse = await authTestManager.login(
        { loginOrEmail: "to_delete", password: "password1" },
        { expectedStatusCode: 201 },
      );

      await request(app)
        .delete(`/users/${created.body.id}`)
        .set("Authorization", "Basic YWRtaW46cXdlcnR5");

      await authTestManager.me({
        expectedStatusCode: 401,
        authHeader: `Bearer ${loginResponse.body.accessToken}`,
      });
    });
  });
});
