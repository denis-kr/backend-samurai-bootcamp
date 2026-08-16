import request from "supertest";
import { MongoClient } from "mongodb";
import { app } from "../src/setting.js";
import { blogsTestManager } from "./utils/blogs-manager.js";

const mongoURI = process.env.MONGO_URI || `mongodb://0.0.0.0:27017/samurai`;

//The tests have to be isolated and independent.

describe("Blogs", () => {
  const client = new MongoClient(mongoURI);

  // beforeEach(() => {
  //   //clear all data before running tests
  //   return request(app).delete("/testing/all-data");
  // });
  // afterAll(() => {
  //   return request(app).delete("/testing/all-data");
  // });

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.close();
  });

  //POST /blogs 201
  it("should create a new blog and return 201 status", async () => {
    const data = {
      name: "Blog 1",
      description: "Description 1",
      websiteUrl: "https://www.blog1.com",
    };

    const response = await blogsTestManager.createBlog(data, {
      expectedStatusCode: 201,
      isAuthorized: true,
    });

    expect(response.body.name).toBe(data.name);
    expect(response.body.description).toBe(data.description);
    expect(response.body.websiteUrl).toBe(data.websiteUrl);

    expect(response.body.createdAt).toBeDefined();
    expect(response.body.isMembership).toBe(false);

    // now test that the blog was created
    const responseGet = await request(app).get(`/blogs/${response.body.id}`);
    expect(responseGet.body).toEqual(response.body);
  });

  //POST /blogs 401
  it("should return 401 status for unauthorized request", async () => {
    const newBlog = {
      name: "Blog 1",
      description: "Description 1",
      websiteUrl: "https://www.blog1.com",
    };

    await blogsTestManager.createBlog(newBlog, {
      expectedStatusCode: 401,
    });
    // now test that the blog was not created
    const responseGet = await request(app).get("/blogs");
    expect(responseGet.body).not.toContainEqual(
      expect.objectContaining(newBlog),
    );
  });
});
