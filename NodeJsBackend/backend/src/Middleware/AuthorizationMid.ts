import { Request, Response, NextFunction } from "express";
import { Role } from "../DB_Service/Users/UserModel";

export function roleMiddleware(roleToCheck: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).role;
    if (role !== roleToCheck) {
      return res
        .status(403)
        .send("You do not have the appropriate permission.");
    }
    return next();
  };
}
