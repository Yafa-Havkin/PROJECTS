import { Request, Response, NextFunction } from "express";
import { logger } from "../Utils/Logger";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`Error: ${err.message || err}`);
  const status = err.status || 500;
  res.status(status).send(err.message || "Internal server error");
}
