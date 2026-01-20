import mongoose from "mongoose";
import { logger } from "./Logger";

export class SubmissionSystem {
  static DB: SubmissionSystem = new SubmissionSystem();
  DB_NAME = "LealeAndYafi_Db";
  URI = process.env.MONGODB_URI || `mongodb://localhost:27017/${this.DB_NAME}`;

  async connectToDB(): Promise<void> {
    try {
      await mongoose.connect(this.URI);
      logger.info("Connected to MongoDB");
    } catch (error) {
      logger.error("Database connection failed:", error);
      throw new Error("Database connection failed");
    }
  }
  static async getDB(): Promise<SubmissionSystem> {
    if (mongoose.connection.readyState === 0) {
      await this.DB.connectToDB();
    }
    return this.DB;
  }
}
