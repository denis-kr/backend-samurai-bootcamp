import express from "express";
import type { Express, Request, Response } from "express";

export const app: Express = express();
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  // debugger;
  res.send({ test: "Hello World 123457" });
});

app.listen(3000);
