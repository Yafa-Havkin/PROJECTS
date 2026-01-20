import { Router, Request, Response } from "express";
import { logger } from "../../Utils/Logger";
import {
  validateRegistration,
  isValidEmail,
  isValidPassword,
} from "../../Middleware/ValidateRegistrationMid";
import { userService } from "../../DB_Service/Users/UserService";
import { AuthService } from "./JwtUtils";
const router = Router();

router.post(
  "/register",
  validateRegistration,
  async (req: Request, res: Response) => {
    try {
      const userInfo = req.body;
      const newUser = await userService.createUser(userInfo);
      return res.status(201).send({
        message: "User registered successfully",
        userId: newUser.userId,
      });
    } catch (error) {
      throw new Error("Error during registration");
    }
  }
);

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!isValidEmail(email)) {
      throw new Error("Invalid email.");
    }

    if (!isValidPassword(password)) {
      throw new Error("Invalid password.");
    }

    const user = await userService.findUser(email);
    if (!user) {
      throw new Error("User not found.");
    }
    if (
      !(await userService.passwordVerification(user.userId as string, password))
    ) {
      logger.error("Invalid email or password");
      throw new Error("Invalid email or password");
    }
    const authService = new AuthService();
    const token = authService.generateToken(user.userId as string, user.role);
    logger.info("User logged in successfully");
    res.status(200).send({ message: "Login successful", token });
  } catch (error) {
    return res.status(500).send("Error during login");
  }
});

export default router;
