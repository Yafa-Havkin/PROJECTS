import winston from "winston";
import path from "path";

const today = new Date().toISOString().split("T")[0];
const todayMonth = today.split("-")[0] + "-" + today.split("-")[1];
const logFileName = path.join("logs", `app-${todayMonth}.log`);

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "DD/MM/YYYY HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "logs/errors.log",
      level: "error",
    }),
    new winston.transports.File({ 
      filename: logFileName, 
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp({ format: "DD/MM/YYYY HH:mm:ss" }),
        winston.format((info) => {
          return info.level !== 'error' ? info : false;
        })()
      )
    }),
  ],
});
