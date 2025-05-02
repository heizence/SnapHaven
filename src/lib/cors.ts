import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";

const allowCors =
  (handler: NextApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*"); // 특정 도메인만 허용 가능
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    return handler(req, res);
  };

export default allowCors;
