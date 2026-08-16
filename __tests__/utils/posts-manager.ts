import request from "supertest";
import { app } from "../../src/setting.js";
import type { Post } from "../../src/repositories/posts-repo.js";

export const postsTestManager: any = {
  async createPost(
    data: {
      title: Post["title"];
      shortDescription: Post["shortDescription"];
      content: Post["content"];
      blogId: Post["blogId"];
    },
    {
      expectedStatusCode,
      isAuthorized = false,
    }: { expectedStatusCode: number; isAuthorized?: boolean }
  ) {
    const requestObject = request(app).post("/posts");

    if (isAuthorized) {
      requestObject.set("Authorization", "Basic YWRtaW46cXdlcnR5");
    }

    const response = await requestObject.send(data);

    expect(response.statusCode).toBe(expectedStatusCode);

    if (response.statusCode === 200 || response.statusCode === 201) {
      expect(response.body.title).toBe(data.title);
      expect(response.body.shortDescription).toBe(data.shortDescription);
      expect(response.body.content).toBe(data.content);
      expect(response.body.blogId).toBe(data.blogId);
      //fetch the blog name using the blogId
      const blogResponse = await request(app).get(`/blogs/${data.blogId}`);
      expect(response.body.blogName).toBe(blogResponse.body.name);
    }

    return response;
  },
};
