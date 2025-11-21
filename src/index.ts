import express from "express";
import type { Request, Response } from "express";

const app = express();

app.get("/", (req: Request, res: Response) => {
  // debugger;
  res.send("Hello World 123457");
});

app.listen(3000);
