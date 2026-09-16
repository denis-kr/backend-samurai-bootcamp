import request from "supertest";
import { app } from "../../src/setting.js";

export const authTestManager: any = {
  async login(
    data: { loginOrEmail?: string; password?: string },
    { expectedStatusCode }: { expectedStatusCode: number }
  ) {
    const response = await request(app).post("/auth/login").send(data);

    expect(response.statusCode).toBe(expectedStatusCode);

    if (response.statusCode === 201) {
      expect(response.body.accessToken).toBeDefined();
    }

    return response;
  },
  async me({
    expectedStatusCode,
    authHeader,
  }: {
    expectedStatusCode: number;
    authHeader?: string;
  }) {
    const requestObject = request(app).get("/auth/me");

    if (authHeader) {
      requestObject.set("Authorization", authHeader);
    }

    const response = await requestObject;

    expect(response.statusCode).toBe(expectedStatusCode);

    return response;
  },
};
