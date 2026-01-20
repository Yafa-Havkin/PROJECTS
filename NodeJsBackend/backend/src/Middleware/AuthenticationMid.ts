import { Request, Response, NextFunction } from "express";
import { AuthService } from "../Routers/Authentication/JwtUtils";

const authService = new AuthService();

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  if (!token) {
    return res.status(401).send("Missing token");
  }
  try {
    const decoded = authService.verifyToken(token);
    (req as any).userId = decoded.userId;
    (req as any).role = decoded.role;
    next();
  } catch (error) {
    return res.status(401).send("Invalid or expired token");
  }
}
