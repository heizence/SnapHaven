import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query; // Extract the dynamic parameter

  // Simulated blog post data
  const posts = {
    "hello-world": { title: "Hello World", content: "Welcome to my blog!" },
    "nextjs-guide": { title: "Next.js Guide", content: "Learn Next.js step-by-step." },
  };

  const post = posts[slug as string];

  if (post) {
    res.status(200).json(post); // Return the blog post data
  } else {
    res.status(404).json({ message: "Post not found" });
  }
}
