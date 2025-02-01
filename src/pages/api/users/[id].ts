import { NextApiRequest, NextApiResponse } from "next";

/**
 * This API route listens for requests to /api/users/:id(e.g api/users/1).
 * The id parameter is extracted from the URL
 * The server responds with user data if the id exists, or a 404 error if it doesn't.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query; // Extract the dynamic parameter from the URL

  // Simulated user data
  const users = {
    "1": { name: "John Doe", age: 30, occupation: "Developer" },
    "2": { name: "Jane Smith", age: 25, occupation: "Designer" },
  };

  const user = users[id as string];

  if (user) {
    res.status(200).json(user); // Return the user data
  } else {
    res.status(404).json({ message: "User not found" }); // Handle missing users
  }
}
