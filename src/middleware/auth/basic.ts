import type { Request, Response, NextFunction } from "express";

//encoded creds --> base64
const encodedCreds = Buffer.from("admin:qwerty").toString("base64");

//implement basic auth middleware
export const basicAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  //check if the word Basic is in the header
  const isBasic = authHeader?.split(" ")[0] === "Basic";
  const base64CredsFromClient = authHeader?.split(" ")[1];

  if (isBasic && base64CredsFromClient === encodedCreds) {
    return next();
  }

  return res.sendStatus(401);
};
