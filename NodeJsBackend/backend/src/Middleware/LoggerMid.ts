import { logger } from "../Utils/Logger";
import { Request, Response, NextFunction } from "express";

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const method = req.method;
  const fullPath = req.originalUrl || req.url;
  const timestamp = new Date().toISOString();
  logger.info(`[${timestamp}] Method: ${method}, URL: ${fullPath}`);
  next();
};
