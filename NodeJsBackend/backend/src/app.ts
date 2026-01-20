import express from "express";
import { loggerMiddleware } from "./Middleware/LoggerMid";
import { errorHandler } from "./Middleware/ErrorHandlerMid";
import authRouter from "./Routers/Authentication/AuthenticationRouter";
import teacherRouter from "./Routers/Teacher/TeacherRouter";
import studentRouter from "./Routers/Student/StudentRouter";
import { SubmissionSystem } from "./Utils/ConnectDB";
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
SubmissionSystem.getDB();
app.use(loggerMiddleware);

app.use("/auth", authRouter);
app.use("/teacher", teacherRouter);
app.use("/student", studentRouter);

app.use(errorHandler);

export default app;
