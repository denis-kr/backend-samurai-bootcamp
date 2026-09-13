import request from "supertest";
import { MongoClient } from "mongodb";
import { app } from "../src/setting.js";
import { blogsTestManager } from "./utils/blogs-manager.js";
import { postsTestManager } from "./utils/posts-manager.js";

const mongoURI = process.env.MONGO_URI || `mongodb://0.0.0.0:27017/samurai`;

//The tests have to be isolated and independent.

describe("Blogs", () => {
  const client = new MongoClient(mongoURI);

  beforeEach(() => {
    //clear all data before running tests
    return request(app).delete("/testing/all-data");
  });

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.close();
  });

  describe("POST /blogs", () => {
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

    //POST /blogs 401 with wrong credentials
    it("should return 401 status for request with wrong credentials", async () => {
      const newBlog = {
        name: "Blog 1",
        description: "Description 1",
        websiteUrl: "https://www.blog1.com",
      };

      await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 401,
        authHeader: "Basic d3Jvbmc6Y3JlZHM=",
      });
      // now test that the blog was not created
      const responseGet = await request(app).get("/blogs");
      expect(responseGet.body.items).toHaveLength(0);
    });

    //POST /blogs 400 name is required
    it("should return 400 if name is missing", async () => {
      const newBlog = {
        description: "Description 1",
        websiteUrl: "https://www.blog1.com",
      };

      const response = await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 400,
        isAuthorized: true,
      });
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "name" }),
      );

      const responseGet = await request(app).get("/blogs");
      expect(responseGet.body.items).toHaveLength(0);
    });

    //POST /blogs 400 name is empty after trim
    it("should return 400 if name is a whitespace-only string", async () => {
      const newBlog = {
        name: "   ",
        description: "Description 1",
        websiteUrl: "https://www.blog1.com",
      };

      const response = await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 400,
        isAuthorized: true,
      });
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "name" }),
      );
    });

    //POST /blogs 400 name exceeds max length
    it("should return 400 if name exceeds 15 characters", async () => {
      const newBlog = {
        name: "A".repeat(16),
        description: "Description 1",
        websiteUrl: "https://www.blog1.com",
      };

      const response = await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 400,
        isAuthorized: true,
      });
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "name" }),
      );
    });

    //POST /blogs 201 name at max length boundary
    it("should create a blog when name is exactly 15 characters", async () => {
      const newBlog = {
        name: "A".repeat(15),
        description: "Description 1",
        websiteUrl: "https://www.blog1.com",
      };

      await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 201,
        isAuthorized: true,
      });
    });

    //POST /blogs 400 description is required
    it("should return 400 if description is missing", async () => {
      const newBlog = {
        name: "Blog 1",
        websiteUrl: "https://www.blog1.com",
      };

      const response = await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 400,
        isAuthorized: true,
      });
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "description" }),
      );
    });

    //POST /blogs 400 description is empty after trim
    it("should return 400 if description is a whitespace-only string", async () => {
      const newBlog = {
        name: "Blog 1",
        description: "   ",
        websiteUrl: "https://www.blog1.com",
      };

      const response = await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 400,
        isAuthorized: true,
      });
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "description" }),
      );
    });

    //POST /blogs 400 description exceeds max length
    it("should return 400 if description exceeds 500 characters", async () => {
      const newBlog = {
        name: "Blog 1",
        description: "A".repeat(501),
        websiteUrl: "https://www.blog1.com",
      };

      const response = await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 400,
        isAuthorized: true,
      });
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "description" }),
      );
    });

    //POST /blogs 201 description at max length boundary
    it("should create a blog when description is exactly 500 characters", async () => {
      const newBlog = {
        name: "Blog 1",
        description: "A".repeat(500),
        websiteUrl: "https://www.blog1.com",
      };

      await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 201,
        isAuthorized: true,
      });
    });

    //POST /blogs 400 websiteUrl is required
    it("should return 400 if websiteUrl is missing", async () => {
      const newBlog = {
        name: "Blog 1",
        description: "Description 1",
      };

      const response = await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 400,
        isAuthorized: true,
      });
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "websiteUrl" }),
      );
    });

    //POST /blogs 400 websiteUrl is empty after trim
    it("should return 400 if websiteUrl is a whitespace-only string", async () => {
      const newBlog = {
        name: "Blog 1",
        description: "Description 1",
        websiteUrl: "   ",
      };

      const response = await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 400,
        isAuthorized: true,
      });
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "websiteUrl" }),
      );
    });

    //POST /blogs 400 websiteUrl exceeds max length
    it("should return 400 if websiteUrl exceeds 100 characters", async () => {
      const newBlog = {
        name: "Blog 1",
        description: "Description 1",
        websiteUrl: `https://${"a".repeat(89)}.com`,
      };
      expect(newBlog.websiteUrl).toHaveLength(101);

      const response = await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 400,
        isAuthorized: true,
      });
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "websiteUrl" }),
      );
    });

    //POST /blogs 400 websiteUrl invalid format
    it("should return 400 if websiteUrl has an invalid format", async () => {
      const newBlog = {
        name: "Blog 1",
        description: "Description 1",
        websiteUrl: "http://www.blog1.com",
      };

      const response = await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 400,
        isAuthorized: true,
      });
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "websiteUrl" }),
      );
    });

    //POST /blogs 201 websiteUrl at max length boundary
    it("should create a blog when websiteUrl is exactly 100 characters and valid", async () => {
      const newBlog = {
        name: "Blog 1",
        description: "Description 1",
        websiteUrl: `https://${"a".repeat(88)}.com`,
      };
      expect(newBlog.websiteUrl).toHaveLength(100);

      await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 201,
        isAuthorized: true,
      });
    });

    //POST /blogs 400 multiple invalid fields
    it("should return 400 with an error message per invalid field when multiple fields are invalid", async () => {
      const newBlog = {
        name: "A".repeat(16),
        description: "",
        websiteUrl: "http://invalid",
      };

      const response = await blogsTestManager.createBlog(newBlog, {
        expectedStatusCode: 400,
        isAuthorized: true,
      });
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "name" }),
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "description" }),
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "websiteUrl" }),
      );

      const responseGet = await request(app).get("/blogs");
      expect(responseGet.body.items).toHaveLength(0);
    });
  });

  describe("GET /blogs", () => {
    //GET /blogs 200 empty database
    it("should return 200 with an empty items array and totalCount 0 on a clean DB", async () => {
      const response = await blogsTestManager.getBlogs(
        {},
        { expectedStatusCode: 200 },
      );

      expect(response.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    //GET /blogs 200 does not require authentication
    it("should return 200 without an Authorization header", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await request(app).get("/blogs");

      expect(response.statusCode).toBe(200);
      expect(response.body.items).toContainEqual(
        expect.objectContaining({ id: created.body.id }),
      );
    });

    //GET /blogs 200 maps Mongo doc to id, no _id
    it("should return blogs with an id field and no _id field", async () => {
      await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getBlogs(
        {},
        { expectedStatusCode: 200 },
      );

      expect(response.body.items).toHaveLength(1);
      const item = response.body.items[0];
      expect(item.id).toBeDefined();
      expect(item._id).toBeUndefined();
      expect(item.name).toBe("Blog 1");
    });

    //GET /blogs 200 default pagination when query is omitted
    it("should apply default pagination (pageSize 10, pageNumber 1) when query is omitted", async () => {
      for (let i = 1; i <= 12; i++) {
        await blogsTestManager.createBlog(
          {
            name: `Blog ${i}`,
            description: "Description",
            websiteUrl: "https://www.blog.com",
          },
          { expectedStatusCode: 201, isAuthorized: true },
        );
      }

      const response = await blogsTestManager.getBlogs(
        {},
        { expectedStatusCode: 200 },
      );

      expect(response.body.pageSize).toBe(10);
      expect(response.body.page).toBe(1);
      expect(response.body.totalCount).toBe(12);
      expect(response.body.pagesCount).toBe(2);
      expect(response.body.items).toHaveLength(10);
    });

    //GET /blogs 200 pageSize/pageNumber slice correctly
    it("should return the correct page slice for a given pageSize and pageNumber", async () => {
      for (let i = 1; i <= 5; i++) {
        await blogsTestManager.createBlog(
          {
            name: `Blog ${i}`,
            description: "Description",
            websiteUrl: "https://www.blog.com",
          },
          { expectedStatusCode: 201, isAuthorized: true },
        );
      }

      const response = await blogsTestManager.getBlogs(
        { pageSize: 2, pageNumber: 2, sortBy: "name", sortDirection: "asc" },
        { expectedStatusCode: 200 },
      );

      expect(response.body.pagesCount).toBe(3);
      expect(response.body.page).toBe(2);
      expect(response.body.pageSize).toBe(2);
      expect(response.body.totalCount).toBe(5);
      expect(response.body.items.map((b: any) => b.name)).toEqual([
        "Blog 3",
        "Blog 4",
      ]);
    });

    //GET /blogs 200 sortDirection asc
    it("should sort ascending by the given sortBy field", async () => {
      for (const name of ["Blog B", "Blog A", "Blog C"]) {
        await blogsTestManager.createBlog(
          { name, description: "Description", websiteUrl: "https://www.blog.com" },
          { expectedStatusCode: 201, isAuthorized: true },
        );
      }

      const response = await blogsTestManager.getBlogs(
        { sortBy: "name", sortDirection: "asc" },
        { expectedStatusCode: 200 },
      );

      expect(response.body.items.map((b: any) => b.name)).toEqual([
        "Blog A",
        "Blog B",
        "Blog C",
      ]);
    });

    //GET /blogs 200 sortDirection desc (default)
    it("should sort descending by the given sortBy field by default", async () => {
      for (const name of ["Blog B", "Blog A", "Blog C"]) {
        await blogsTestManager.createBlog(
          { name, description: "Description", websiteUrl: "https://www.blog.com" },
          { expectedStatusCode: 201, isAuthorized: true },
        );
      }

      const response = await blogsTestManager.getBlogs(
        { sortBy: "name" },
        { expectedStatusCode: 200 },
      );

      expect(response.body.items.map((b: any) => b.name)).toEqual([
        "Blog C",
        "Blog B",
        "Blog A",
      ]);
    });

    //GET /blogs 200 searchNameTerm filters case-insensitively
    it("should filter items by searchNameTerm case-insensitively", async () => {
      for (const name of ["Apple Blog", "Banana Blog", "Cherry"]) {
        await blogsTestManager.createBlog(
          { name, description: "Description", websiteUrl: "https://www.blog.com" },
          { expectedStatusCode: 201, isAuthorized: true },
        );
      }

      const response = await blogsTestManager.getBlogs(
        { searchNameTerm: "AN" },
        { expectedStatusCode: 200 },
      );

      expect(response.body.totalCount).toBe(1);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].name).toBe("Banana Blog");
    });

    //GET /blogs 400 pageSize is not an integer
    it("should return 400 if pageSize is not an integer", async () => {
      const response = await blogsTestManager.getBlogs(
        { pageSize: "abc" },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "pageSize" }),
      );
    });

    //GET /blogs 400 pageSize below minimum
    it("should return 400 if pageSize is 0", async () => {
      const response = await blogsTestManager.getBlogs(
        { pageSize: 0 },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "pageSize" }),
      );
    });

    //GET /blogs 200 pageSize at minimum boundary
    it("should accept pageSize exactly 1", async () => {
      const response = await blogsTestManager.getBlogs(
        { pageSize: 1 },
        { expectedStatusCode: 200 },
      );

      expect(response.body.pageSize).toBe(1);
    });

    //GET /blogs 400 pageNumber is not an integer
    it("should return 400 if pageNumber is not an integer", async () => {
      const response = await blogsTestManager.getBlogs(
        { pageNumber: "abc" },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "pageNumber" }),
      );
    });

    //GET /blogs 400 pageNumber below minimum
    it("should return 400 if pageNumber is 0", async () => {
      const response = await blogsTestManager.getBlogs(
        { pageNumber: 0 },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "pageNumber" }),
      );
    });

    //GET /blogs 400 sortBy is not a string
    it("should return 400 if sortBy is not a string", async () => {
      const response = await blogsTestManager.getBlogs(
        { sortBy: ["a", "b"] as any },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "sortBy" }),
      );
    });

    //GET /blogs 400 sortDirection is not 'asc' or 'desc'
    it("should return 400 if sortDirection is neither 'asc' nor 'desc'", async () => {
      const response = await blogsTestManager.getBlogs(
        { sortDirection: "sideways" },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "sortDirection" }),
      );
    });

    //GET /blogs 400 multiple invalid query params
    it("should return 400 with an error message per invalid field when multiple query params are invalid", async () => {
      const response = await blogsTestManager.getBlogs(
        { pageSize: 0, sortDirection: "sideways" },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "pageSize" }),
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "sortDirection" }),
      );
    });
  });

  describe("GET /blogs/:id", () => {
    //GET /blogs/:id 200
    it("should return the blog matching the given id", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getBlogById(created.body.id, {
        expectedStatusCode: 200,
      });

      expect(response.body).toEqual(created.body);
    });

    //GET /blogs/:id 200 does not require authentication
    it("should return 200 without an Authorization header", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await request(app).get(`/blogs/${created.body.id}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe(created.body.id);
    });

    //GET /blogs/:id 200 maps Mongo doc to id, no _id field
    it("should return the blog with an id field and no _id field", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getBlogById(created.body.id, {
        expectedStatusCode: 200,
      });

      expect(response.body.id).toBe(created.body.id);
      expect(response.body._id).toBeUndefined();
    });

    //GET /blogs/:id 400 id is a whitespace-only string
    it("should return 400 if id is a whitespace-only string", async () => {
      const response = await request(app).get("/blogs/%20");

      expect(response.statusCode).toBe(400);
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "id" }),
      );
    });

    //GET /blogs/:id 404 well-formed id but no matching blog
    it("should return 404 if no blog exists with the given id", async () => {
      await blogsTestManager.getBlogById("507f1f77bcf86cd799439011", {
        expectedStatusCode: 404,
      });
    });

    //GET /blogs/:id 404 malformed id (not a valid ObjectId)
    it("should return 404 if the id is not a valid ObjectId", async () => {
      await blogsTestManager.getBlogById("invalid-id", {
        expectedStatusCode: 404,
      });
    });
  });

  describe("GET /blogs/:blogId/posts", () => {
    //GET /blogs/:blogId/posts 200
    it("should return the posts belonging to the given blog", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const post = await postsTestManager.createPost(
        {
          title: "Post 1",
          shortDescription: "Short description",
          content: "Content",
          blogId: blog.body.id,
        },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        {},
        { expectedStatusCode: 200 },
      );

      expect(response.body).toEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 1,
        items: [post.body],
      });
    });

    //GET /blogs/:blogId/posts 200 maps Mongo doc to id, no _id field
    it("should return posts with an id field and no _id field", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await postsTestManager.createPost(
        {
          title: "Post 1",
          shortDescription: "Short description",
          content: "Content",
          blogId: blog.body.id,
        },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        {},
        { expectedStatusCode: 200 },
      );

      expect(response.body.items).toHaveLength(1);
      const item = response.body.items[0];
      expect(item.id).toBeDefined();
      expect(item._id).toBeUndefined();
      expect(item.blogId).toBe(blog.body.id);
    });

    //GET /blogs/:blogId/posts 200 does not require authentication
    it("should return 200 without an Authorization header", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await request(app).get(`/blogs/${blog.body.id}/posts`);

      expect(response.statusCode).toBe(200);
    });

    //GET /blogs/:blogId/posts 200 empty items array and totalCount 0 for a blog with no posts
    it("should return an empty items array and totalCount 0 for a blog with no posts", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        {},
        { expectedStatusCode: 200 },
      );

      expect(response.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    //GET /blogs/:blogId/posts 200 only returns posts for the specified blog
    it("should not return posts belonging to a different blog", async () => {
      const blog1 = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );
      const blog2 = await blogsTestManager.createBlog(
        { name: "Blog 2", description: "Description 2", websiteUrl: "https://www.blog2.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await postsTestManager.createPost(
        {
          title: "Post for blog 1",
          shortDescription: "Short description",
          content: "Content",
          blogId: blog1.body.id,
        },
        { expectedStatusCode: 201, isAuthorized: true },
      );
      await postsTestManager.createPost(
        {
          title: "Post for blog 2",
          shortDescription: "Short description",
          content: "Content",
          blogId: blog2.body.id,
        },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getPostsForBlog(
        blog1.body.id,
        {},
        { expectedStatusCode: 200 },
      );

      expect(response.body.totalCount).toBe(1);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].title).toBe("Post for blog 1");
    });

    //GET /blogs/:blogId/posts 400 blogId is a whitespace-only string
    it("should return 400 if blogId is a whitespace-only string", async () => {
      const response = await request(app).get("/blogs/%20/posts");

      expect(response.statusCode).toBe(400);
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "blogId" }),
      );
    });

    //GET /blogs/:blogId/posts 404 well-formed blogId but no matching blog
    it("should return 404 if no blog exists with the given blogId", async () => {
      await blogsTestManager.getPostsForBlog(
        "507f1f77bcf86cd799439011",
        {},
        { expectedStatusCode: 404 },
      );
    });

    //GET /blogs/:blogId/posts 404 malformed blogId (not a valid ObjectId)
    it("should return 404 if the blogId is not a valid ObjectId", async () => {
      await blogsTestManager.getPostsForBlog(
        "invalid-id",
        {},
        { expectedStatusCode: 404 },
      );
    });

    //GET /blogs/:blogId/posts 200 default pagination when query is omitted
    it("should apply default pagination (pageSize 10, pageNumber 1) when query is omitted", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      for (let i = 1; i <= 12; i++) {
        await postsTestManager.createPost(
          {
            title: `Post ${i}`,
            shortDescription: "Short description",
            content: "Content",
            blogId: blog.body.id,
          },
          { expectedStatusCode: 201, isAuthorized: true },
        );
      }

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        {},
        { expectedStatusCode: 200 },
      );

      expect(response.body.pageSize).toBe(10);
      expect(response.body.page).toBe(1);
      expect(response.body.totalCount).toBe(12);
      expect(response.body.pagesCount).toBe(2);
      expect(response.body.items).toHaveLength(10);
    });

    //GET /blogs/:blogId/posts 200 pageSize/pageNumber slice correctly
    it("should return the correct page slice for a given pageSize and pageNumber", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      for (let i = 1; i <= 5; i++) {
        await postsTestManager.createPost(
          {
            title: `Post ${i}`,
            shortDescription: "Short description",
            content: "Content",
            blogId: blog.body.id,
          },
          { expectedStatusCode: 201, isAuthorized: true },
        );
      }

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        { pageSize: 2, pageNumber: 2, sortBy: "title", sortDirection: "asc" },
        { expectedStatusCode: 200 },
      );

      expect(response.body.pagesCount).toBe(3);
      expect(response.body.page).toBe(2);
      expect(response.body.pageSize).toBe(2);
      expect(response.body.totalCount).toBe(5);
      expect(response.body.items.map((p: any) => p.title)).toEqual([
        "Post 3",
        "Post 4",
      ]);
    });

    //GET /blogs/:blogId/posts 200 sortDirection asc
    it("should sort ascending by the given sortBy field", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      for (const title of ["Post B", "Post A", "Post C"]) {
        await postsTestManager.createPost(
          {
            title,
            shortDescription: "Short description",
            content: "Content",
            blogId: blog.body.id,
          },
          { expectedStatusCode: 201, isAuthorized: true },
        );
      }

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        { sortBy: "title", sortDirection: "asc" },
        { expectedStatusCode: 200 },
      );

      expect(response.body.items.map((p: any) => p.title)).toEqual([
        "Post A",
        "Post B",
        "Post C",
      ]);
    });

    //GET /blogs/:blogId/posts 200 sortDirection desc (default)
    it("should sort descending by the given sortBy field by default", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      for (const title of ["Post B", "Post A", "Post C"]) {
        await postsTestManager.createPost(
          {
            title,
            shortDescription: "Short description",
            content: "Content",
            blogId: blog.body.id,
          },
          { expectedStatusCode: 201, isAuthorized: true },
        );
      }

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        { sortBy: "title" },
        { expectedStatusCode: 200 },
      );

      expect(response.body.items.map((p: any) => p.title)).toEqual([
        "Post C",
        "Post B",
        "Post A",
      ]);
    });

    //GET /blogs/:blogId/posts 400 pageSize is not an integer
    it("should return 400 if pageSize is not an integer", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        { pageSize: "abc" },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "pageSize" }),
      );
    });

    //GET /blogs/:blogId/posts 400 pageSize below minimum
    it("should return 400 if pageSize is 0", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        { pageSize: 0 },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "pageSize" }),
      );
    });

    //GET /blogs/:blogId/posts 200 pageSize at minimum boundary
    it("should accept pageSize exactly 1", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        { pageSize: 1 },
        { expectedStatusCode: 200 },
      );

      expect(response.body.pageSize).toBe(1);
    });

    //GET /blogs/:blogId/posts 400 pageNumber is not an integer
    it("should return 400 if pageNumber is not an integer", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        { pageNumber: "abc" },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "pageNumber" }),
      );
    });

    //GET /blogs/:blogId/posts 400 pageNumber below minimum
    it("should return 400 if pageNumber is 0", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        { pageNumber: 0 },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "pageNumber" }),
      );
    });

    //GET /blogs/:blogId/posts 400 sortBy is not a string
    it("should return 400 if sortBy is not a string", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        { sortBy: ["a", "b"] as any },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "sortBy" }),
      );
    });

    //GET /blogs/:blogId/posts 400 sortDirection is not 'asc' or 'desc'
    it("should return 400 if sortDirection is neither 'asc' nor 'desc'", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        { sortDirection: "sideways" },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "sortDirection" }),
      );
    });

    //GET /blogs/:blogId/posts 400 multiple invalid query params
    it("should return 400 with an error message per invalid field when multiple query params are invalid", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        { pageSize: 0, sortDirection: "sideways" },
        { expectedStatusCode: 400 },
      );

      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "pageSize" }),
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "sortDirection" }),
      );
    });
  });

  describe("POST /blogs/:blogId/posts", () => {
    //POST /blogs/:blogId/posts 201
    it("should create a new post for the given blog and return 201 status", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const data = {
        title: "Post 1",
        shortDescription: "Short description",
        content: "Content",
      };

      const response = await blogsTestManager.createPostForBlog(
        blog.body.id,
        data,
        { expectedStatusCode: 201, isAuthorized: true },
      );

      expect(response.body.title).toBe(data.title);
      expect(response.body.shortDescription).toBe(data.shortDescription);
      expect(response.body.content).toBe(data.content);
      expect(response.body.blogId).toBe(blog.body.id);
      expect(response.body.blogName).toBe(blog.body.name);
      expect(response.body.id).toBeDefined();
      expect(response.body._id).toBeUndefined();

      // now test that the post was created
      const responseGet = await request(app).get(`/posts/${response.body.id}`);
      expect(responseGet.body).toEqual(response.body);
    });

    //POST /blogs/:blogId/posts 401 no Authorization header
    it("should return 401 status for unauthorized request", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "Post 1", shortDescription: "Short description", content: "Content" },
        { expectedStatusCode: 401 },
      );

      const responseGet = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        {},
        { expectedStatusCode: 200 },
      );
      expect(responseGet.body.items).toHaveLength(0);
    });

    //POST /blogs/:blogId/posts 401 with wrong credentials
    it("should return 401 status for request with wrong credentials", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "Post 1", shortDescription: "Short description", content: "Content" },
        { expectedStatusCode: 401, authHeader: "Basic d3Jvbmc6Y3JlZHM=" },
      );

      const responseGet = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        {},
        { expectedStatusCode: 200 },
      );
      expect(responseGet.body.items).toHaveLength(0);
    });

    //POST /blogs/:blogId/posts 400 blogId is a whitespace-only string
    it("should return 400 if blogId is a whitespace-only string", async () => {
      const response = await request(app)
        .post("/blogs/%20/posts")
        .set("Authorization", "Basic YWRtaW46cXdlcnR5")
        .send({ title: "Post 1", shortDescription: "Short description", content: "Content" });

      expect(response.statusCode).toBe(400);
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "blogId" }),
      );
    });

    //POST /blogs/:blogId/posts 404 well-formed blogId but no matching blog
    it("should return 404 if no blog exists with the given blogId", async () => {
      await blogsTestManager.createPostForBlog(
        "507f1f77bcf86cd799439011",
        { title: "Post 1", shortDescription: "Short description", content: "Content" },
        { expectedStatusCode: 404, isAuthorized: true },
      );
    });

    //POST /blogs/:blogId/posts 404 malformed blogId (not a valid ObjectId)
    it("should return 404 if the blogId is not a valid ObjectId", async () => {
      await blogsTestManager.createPostForBlog(
        "invalid-id",
        { title: "Post 1", shortDescription: "Short description", content: "Content" },
        { expectedStatusCode: 404, isAuthorized: true },
      );
    });

    //POST /blogs/:blogId/posts 400 title is required
    it("should return 400 if title is missing", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.createPostForBlog(
        blog.body.id,
        { shortDescription: "Short description", content: "Content" },
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "title" }),
      );

      const responseGet = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        {},
        { expectedStatusCode: 200 },
      );
      expect(responseGet.body.items).toHaveLength(0);
    });

    //POST /blogs/:blogId/posts 400 title is empty after trim
    it("should return 400 if title is a whitespace-only string", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "   ", shortDescription: "Short description", content: "Content" },
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "title" }),
      );
    });

    //POST /blogs/:blogId/posts 400 title exceeds max length
    it("should return 400 if title exceeds 30 characters", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "A".repeat(31), shortDescription: "Short description", content: "Content" },
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "title" }),
      );
    });

    //POST /blogs/:blogId/posts 201 title at max length boundary
    it("should create a post when title is exactly 30 characters", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "A".repeat(30), shortDescription: "Short description", content: "Content" },
        { expectedStatusCode: 201, isAuthorized: true },
      );
    });

    //POST /blogs/:blogId/posts 400 shortDescription is required
    it("should return 400 if shortDescription is missing", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "Post 1", content: "Content" },
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "shortDescription" }),
      );
    });

    //POST /blogs/:blogId/posts 400 shortDescription is empty after trim
    it("should return 400 if shortDescription is a whitespace-only string", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "Post 1", shortDescription: "   ", content: "Content" },
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "shortDescription" }),
      );
    });

    //POST /blogs/:blogId/posts 400 shortDescription exceeds max length
    it("should return 400 if shortDescription exceeds 100 characters", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "Post 1", shortDescription: "A".repeat(101), content: "Content" },
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "shortDescription" }),
      );
    });

    //POST /blogs/:blogId/posts 201 shortDescription at max length boundary
    it("should create a post when shortDescription is exactly 100 characters", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "Post 1", shortDescription: "A".repeat(100), content: "Content" },
        { expectedStatusCode: 201, isAuthorized: true },
      );
    });

    //POST /blogs/:blogId/posts 400 content is required
    it("should return 400 if content is missing", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "Post 1", shortDescription: "Short description" },
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "content" }),
      );
    });

    //POST /blogs/:blogId/posts 400 content is empty after trim
    it("should return 400 if content is a whitespace-only string", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "Post 1", shortDescription: "Short description", content: "   " },
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "content" }),
      );
    });

    //POST /blogs/:blogId/posts 400 content exceeds max length
    it("should return 400 if content exceeds 1000 characters", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "Post 1", shortDescription: "Short description", content: "A".repeat(1001) },
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "content" }),
      );
    });

    //POST /blogs/:blogId/posts 201 content at max length boundary
    it("should create a post when content is exactly 1000 characters", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "Post 1", shortDescription: "Short description", content: "A".repeat(1000) },
        { expectedStatusCode: 201, isAuthorized: true },
      );
    });

    //POST /blogs/:blogId/posts 400 multiple invalid fields
    it("should return 400 with an error message per invalid field when multiple fields are invalid", async () => {
      const blog = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.createPostForBlog(
        blog.body.id,
        { title: "A".repeat(31), shortDescription: "", content: "A".repeat(1001) },
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "title" }),
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "shortDescription" }),
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "content" }),
      );

      const responseGet = await blogsTestManager.getPostsForBlog(
        blog.body.id,
        {},
        { expectedStatusCode: 200 },
      );
      expect(responseGet.body.items).toHaveLength(0);
    });
  });

  describe("DELETE /blogs/:id", () => {
    //DELETE /blogs/:id 204
    it("should delete the blog and return 204 status", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await blogsTestManager.deleteBlog(created.body.id, {
        expectedStatusCode: 204,
        isAuthorized: true,
      });

      const responseGet = await request(app).get(`/blogs/${created.body.id}`);
      expect(responseGet.statusCode).toBe(404);
    });

    //DELETE /blogs/:id 401 no Authorization header
    it("should return 401 status for unauthorized request", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await blogsTestManager.deleteBlog(created.body.id, {
        expectedStatusCode: 401,
      });

      const responseGet = await request(app).get(`/blogs/${created.body.id}`);
      expect(responseGet.statusCode).toBe(200);
    });

    //DELETE /blogs/:id 401 with wrong credentials
    it("should return 401 status for request with wrong credentials", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await blogsTestManager.deleteBlog(created.body.id, {
        expectedStatusCode: 401,
        authHeader: "Basic d3Jvbmc6Y3JlZHM=",
      });

      const responseGet = await request(app).get(`/blogs/${created.body.id}`);
      expect(responseGet.statusCode).toBe(200);
    });

    //DELETE /blogs/:id 404 well-formed id but no matching blog
    it("should return 404 if no blog exists with the given id", async () => {
      await blogsTestManager.deleteBlog("507f1f77bcf86cd799439011", {
        expectedStatusCode: 404,
        isAuthorized: true,
      });
    });

    //DELETE /blogs/:id 404 malformed id (not a valid ObjectId)
    it("should return 404 if the id is not a valid ObjectId", async () => {
      await blogsTestManager.deleteBlog("invalid-id", {
        expectedStatusCode: 404,
        isAuthorized: true,
      });
    });

    //DELETE /blogs/:id 404 on second delete of the same blog
    it("should return 404 when deleting the same blog a second time", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await blogsTestManager.deleteBlog(created.body.id, {
        expectedStatusCode: 204,
        isAuthorized: true,
      });

      await blogsTestManager.deleteBlog(created.body.id, {
        expectedStatusCode: 404,
        isAuthorized: true,
      });
    });
  });

  describe("PUT /blogs/:id", () => {
    //PUT /blogs/:id 204
    it("should update the blog and return 204 status", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const updateData = {
        name: "Updated",
        description: "Updated Description",
        websiteUrl: "https://www.updated.com",
      };

      await blogsTestManager.updateBlog(updateData, created.body.id, {
        expectedStatusCode: 204,
        isAuthorized: true,
      });

      const responseGet = await request(app).get(`/blogs/${created.body.id}`);
      expect(responseGet.body.name).toBe(updateData.name);
      expect(responseGet.body.description).toBe(updateData.description);
      expect(responseGet.body.websiteUrl).toBe(updateData.websiteUrl);
      expect(responseGet.body.id).toBe(created.body.id);
    });

    //PUT /blogs/:id 401 no Authorization header
    it("should return 401 status for unauthorized request", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await blogsTestManager.updateBlog(
        { name: "Updated", description: "Updated Description", websiteUrl: "https://www.updated.com" },
        created.body.id,
        { expectedStatusCode: 401 },
      );

      const responseGet = await request(app).get(`/blogs/${created.body.id}`);
      expect(responseGet.body.name).toBe("Blog 1");
    });

    //PUT /blogs/:id 401 with wrong credentials
    it("should return 401 status for request with wrong credentials", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await blogsTestManager.updateBlog(
        { name: "Updated", description: "Updated Description", websiteUrl: "https://www.updated.com" },
        created.body.id,
        { expectedStatusCode: 401, authHeader: "Basic d3Jvbmc6Y3JlZHM=" },
      );

      const responseGet = await request(app).get(`/blogs/${created.body.id}`);
      expect(responseGet.body.name).toBe("Blog 1");
    });

    //PUT /blogs/:id 404 well-formed id but no matching blog
    it("should return 404 if no blog exists with the given id", async () => {
      await blogsTestManager.updateBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        "507f1f77bcf86cd799439011",
        { expectedStatusCode: 404, isAuthorized: true },
      );
    });

    //PUT /blogs/:id 404 malformed id (not a valid ObjectId)
    it("should return 404 if the id is not a valid ObjectId", async () => {
      await blogsTestManager.updateBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        "invalid-id",
        { expectedStatusCode: 404, isAuthorized: true },
      );
    });

    //PUT /blogs/:id 400 name is required
    it("should return 400 if name is missing", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.updateBlog(
        { description: "Description 1", websiteUrl: "https://www.blog1.com" },
        created.body.id,
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "name" }),
      );

      const responseGet = await request(app).get(`/blogs/${created.body.id}`);
      expect(responseGet.body.name).toBe("Blog 1");
    });

    //PUT /blogs/:id 400 name is empty after trim
    it("should return 400 if name is a whitespace-only string", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.updateBlog(
        { name: "   ", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        created.body.id,
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "name" }),
      );
    });

    //PUT /blogs/:id 400 name exceeds max length
    it("should return 400 if name exceeds 15 characters", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.updateBlog(
        { name: "A".repeat(16), description: "Description 1", websiteUrl: "https://www.blog1.com" },
        created.body.id,
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "name" }),
      );
    });

    //PUT /blogs/:id 204 name at max length boundary
    it("should update the blog when name is exactly 15 characters", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await blogsTestManager.updateBlog(
        { name: "A".repeat(15), description: "Description 1", websiteUrl: "https://www.blog1.com" },
        created.body.id,
        { expectedStatusCode: 204, isAuthorized: true },
      );
    });

    //PUT /blogs/:id 400 description is required
    it("should return 400 if description is missing", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.updateBlog(
        { name: "Blog 1", websiteUrl: "https://www.blog1.com" },
        created.body.id,
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "description" }),
      );
    });

    //PUT /blogs/:id 400 description is empty after trim
    it("should return 400 if description is a whitespace-only string", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.updateBlog(
        { name: "Blog 1", description: "   ", websiteUrl: "https://www.blog1.com" },
        created.body.id,
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "description" }),
      );
    });

    //PUT /blogs/:id 400 description exceeds max length
    it("should return 400 if description exceeds 500 characters", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.updateBlog(
        { name: "Blog 1", description: "A".repeat(501), websiteUrl: "https://www.blog1.com" },
        created.body.id,
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "description" }),
      );
    });

    //PUT /blogs/:id 204 description at max length boundary
    it("should update the blog when description is exactly 500 characters", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      await blogsTestManager.updateBlog(
        { name: "Blog 1", description: "A".repeat(500), websiteUrl: "https://www.blog1.com" },
        created.body.id,
        { expectedStatusCode: 204, isAuthorized: true },
      );
    });

    //PUT /blogs/:id 400 websiteUrl is required
    it("should return 400 if websiteUrl is missing", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.updateBlog(
        { name: "Blog 1", description: "Description 1" },
        created.body.id,
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "websiteUrl" }),
      );
    });

    //PUT /blogs/:id 400 websiteUrl is empty after trim
    it("should return 400 if websiteUrl is a whitespace-only string", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.updateBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "   " },
        created.body.id,
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "websiteUrl" }),
      );
    });

    //PUT /blogs/:id 400 websiteUrl exceeds max length
    it("should return 400 if websiteUrl exceeds 100 characters", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const websiteUrl = `https://${"a".repeat(89)}.com`;
      expect(websiteUrl).toHaveLength(101);

      const response = await blogsTestManager.updateBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl },
        created.body.id,
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "websiteUrl" }),
      );
    });

    //PUT /blogs/:id 400 websiteUrl invalid format
    it("should return 400 if websiteUrl has an invalid format", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.updateBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "http://www.blog1.com" },
        created.body.id,
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "websiteUrl" }),
      );
    });

    //PUT /blogs/:id 204 websiteUrl at max length boundary
    it("should update the blog when websiteUrl is exactly 100 characters and valid", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const websiteUrl = `https://${"a".repeat(88)}.com`;
      expect(websiteUrl).toHaveLength(100);

      await blogsTestManager.updateBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl },
        created.body.id,
        { expectedStatusCode: 204, isAuthorized: true },
      );
    });

    //PUT /blogs/:id 400 multiple invalid fields
    it("should return 400 with an error message per invalid field when multiple fields are invalid", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const response = await blogsTestManager.updateBlog(
        { name: "A".repeat(16), description: "", websiteUrl: "http://invalid" },
        created.body.id,
        { expectedStatusCode: 400, isAuthorized: true },
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "name" }),
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "description" }),
      );
      expect(response.body.errorsMessages).toContainEqual(
        expect.objectContaining({ field: "websiteUrl" }),
      );

      const responseGet = await request(app).get(`/blogs/${created.body.id}`);
      expect(responseGet.body.name).toBe("Blog 1");
    });

    //PUT /blogs/:id 204 both times when updating the same blog twice (idempotent, unlike DELETE)
    it("should return 204 both times when updating the same blog twice with valid data", async () => {
      const created = await blogsTestManager.createBlog(
        { name: "Blog 1", description: "Description 1", websiteUrl: "https://www.blog1.com" },
        { expectedStatusCode: 201, isAuthorized: true },
      );

      const updateData = {
        name: "Updated",
        description: "Updated Description",
        websiteUrl: "https://www.updated.com",
      };

      await blogsTestManager.updateBlog(updateData, created.body.id, {
        expectedStatusCode: 204,
        isAuthorized: true,
      });

      await blogsTestManager.updateBlog(updateData, created.body.id, {
        expectedStatusCode: 204,
        isAuthorized: true,
      });

      const responseGet = await request(app).get(`/blogs/${created.body.id}`);
      expect(responseGet.body.name).toBe(updateData.name);
    });
  });
});
