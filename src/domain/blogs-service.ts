import { blogsRepository } from "../repositories/blogs-repo.js";
import type { Blog } from "../repositories/blogs-repo.js";

export const blogsService = {
  findAllBlogs: () => {
    return blogsRepository.findAll();
  },
  findBlogById: (id: string) => {
    return blogsRepository.findById(id);
  },
  deleteBlogById: (id: string) => {
    return blogsRepository.deleteById(id);
  },
  createBlog: (blog: Omit<Blog, "createdAt" | "isMembership">) => {
    const newBlog: Blog = {
      ...blog,
      isMembership: false,
      createdAt: new Date(),
    };
    return blogsRepository.create(newBlog);
  },
  updateBlog(id: string, blog: Omit<Blog, "createdAt" | "isMembership">) {
    return blogsRepository.updateById(id, blog);
  },
};
export default blogsService;
