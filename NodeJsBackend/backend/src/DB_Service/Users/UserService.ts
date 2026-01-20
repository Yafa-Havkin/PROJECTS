import { IUser, User } from "./UserModel";
import bcrypt from "bcrypt";

class UserService {
  async createUser(userInfo: IUser) {
    try {
      const hashedPassword = await bcrypt.hash(userInfo.password, 10);
      const userWithHashedPassword = { ...userInfo, password: hashedPassword };
      const user = new User(userWithHashedPassword);
      return await user.save();
    } catch (error) {
      throw new Error(
        "Creating new user failed: " +
          (error && typeof (error as any).message === "string"
            ? (error as any).message
            : String(error))
      );
    }
  }

  async findUser(email: string): Promise<IUser | null> {
    try {
      return await User.findOne({ email });
    } catch (error) {
      throw new Error(
        "Finding user failed: " +
          (error && typeof (error as any).message === "string"
            ? (error as any).message
            : String(error))
      );
    }
  }

  async passwordVerification(
    userId: string,
    password: string
  ): Promise<boolean> {
    try {
      const user = await User.findOne({ userId });
      if(!user){
        return false;
      }
      return await bcrypt.compare(password,user.password);
    } catch (error) {
      throw new Error(
        "Password verification failed: " +
          (error && typeof (error as any).message === "string"
            ? (error as any).message
            : String(error))
      );
    }
  }
}

export const userService = new UserService();
