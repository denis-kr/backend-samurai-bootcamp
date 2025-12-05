import { app } from "../src/index.js";
import request from "supertest";

describe("GET /hello", () => {
  it("should return Hello World message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ test: "Hello World 123457" });
    expect(1 + 1).toBe(2);
  });
});
