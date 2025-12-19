import { postsRepository } from "../repositories/posts-repo.js";
import type { Post } from "../repositories/posts-repo.js";

export const postsService = {
  findAllPosts: () => {
    return postsRepository.findAll();
  },
  findPostById: (id: string) => {
    return postsRepository.findById(id);
  },
  deletePostById: (id: string) => {
    return postsRepository.deleteById(id);
  },
  createPost: (post: Post) => {
    return postsRepository.create(post);
  },
  updatePost(id: string, post: Post) {
    return postsRepository.updateById(id, post);
  },
};
