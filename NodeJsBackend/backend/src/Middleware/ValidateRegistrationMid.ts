import { Request, Response, NextFunction } from "express";
import { isUnique, isStrong } from "./UserValidationMid";

const TEACHER_CODE = "leahleandyafi";

export function isValidId(userId: string): boolean {
  if (userId == undefined) {
    return false;
  }
  if (userId.length != 9) {
    return false;
  }
  if (!/^[0-9]+$/.test(userId)) {
    return false;
  }
  return true;
}

export function isValidName(name: string): boolean {
  if (name == undefined) {
    return false;
  }
  if (name.length < 3) {
    return false;
  }
  if (!/^[a-zA-Z]+$/.test(name)) {
    return false;
  }
  return true;
}

export function isValidEmail(email: string): boolean {
  if (email == undefined) {
    return false;
  }
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return false;
  }

  return true;
}

export function isValidPassword(password: string): boolean {
  if (password == undefined) {
    return false;
  }
  return isStrong(password);
}

export const validateRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, name, email, password, role, teacherCode } = req.body;

  if (!isValidId(userId)) {
    return res.status(400).send("Invalid Id.");
  }
  if (!(await isUnique("userId", userId))) {
    return res.status(400).send("Id already exists.");
  }
  if (!isValidName(name)) {
    return res.status(400).send("Invalid name.");
  }
  if (!isValidEmail(email)) {
    return res.status(400).send("Invalid email.");
  }
  if (!(await isUnique("email", email))) {
    return res.status(400).send("Email already exists.");
  }
  if (!isStrong(password)) {
    return res.status(400).send("Password is not strong enough.");
  }

  if (role === 1 && teacherCode !== TEACHER_CODE) {
    return res.status(403).send("Invalid teacher authorization code.");
  }

  next();
};

export const validateEmailMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  if (!isValidEmail(email)) {
    return res.status(400).send("Invalid email.");
  }
  next();
};

export const validatePasswordMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { password } = req.body;
  if (!isValidPassword(password)) {
    return res.status(400).send("Invalid password.");
  }
  next();
};
