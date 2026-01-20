import jwt from "jsonwebtoken";

const MANAGER_PASSWORD = "leahleandyafi";

export class AuthService {
  generateToken(userId: string, role: number): string {
    try {
      const payload = { userId, role };
      return jwt.sign(payload, MANAGER_PASSWORD, { expiresIn: "30d" });
    } catch (error) {
      throw new Error(
        "Generating token failed: " +
          (error && typeof (error as any).message === "string"
            ? (error as any).message
            : String(error))
      );
    }
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, MANAGER_PASSWORD);
    } catch (error) {
      throw new Error(
        "Verifying token failed: " +
          (error && typeof (error as any).message === "string"
            ? (error as any).message
            : String(error))
      );
    }
  }
}
