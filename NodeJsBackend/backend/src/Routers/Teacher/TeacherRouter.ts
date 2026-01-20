import { Router, Request, Response } from "express";
import { logger } from "../../Utils/Logger";
import { roleMiddleware } from "../../Middleware/AuthorizationMid";
import { authenticate } from "../../Middleware/AuthenticationMid";
import { assignmentService } from "../../DB_Service/Assignments/AssignmentsService";
import { submissionService } from "../../DB_Service/Submission/SubmissionService";
import { Role } from "../../DB_Service/Users/UserModel";
import mongoose from "mongoose";

const router = Router();

router.use(authenticate);
router.use(roleMiddleware(Role.teacher));

router.post("/assignments", async (req: Request, res: Response) => {
  try {
    const assignmentInfo = req.body;
    const assignment = await assignmentService.createAssignment(assignmentInfo);
    logger.info("Assignment created successfully.");
    return res.status(201).send(assignment);
  } catch (error) {
    throw new Error("Error creating assignment");
  }
});

router.get("/assignments", async (req: Request, res: Response) => {
  try {
    const assignments = await assignmentService.getAllAssignments();
    return res.status(200).send(assignments);
  } catch (error) {
    throw new Error("Error retrieving assignments");
  }
});

router.get("/submissions", async (req: Request, res: Response) => {
  try {
    const submissions = await submissionService.getAllSubmissions();
    return res.status(200).send(submissions);
  } catch (error) {
    throw new Error("Error retrieving submissions");
  }
});

router.put("/:studentId/:assignmentId", async (req: Request, res: Response) => {
  try {
    const { studentId, assignmentId } = req.params;
    const submission = await submissionService.findSubmissionByIds(
      studentId,
      new mongoose.Types.ObjectId(assignmentId)
    );
    const { grade, feedback } = req.body;
    await submissionService.gradingAndFeedback(submission, grade, feedback);
    return res.status(200).send("Submission updated successfully");
  } catch (error) {
    throw new Error("Error updating submission");
  }
});

router.get("/stats/averages", async (req: Request, res: Response) => {
  try {
    const averageGrades =
      await submissionService.getAverageGradesPerAssignment();
    return res.status(200).send(averageGrades);
  } catch (error) {
    throw new Error("Error retrieving average grades");
  }
});

export default router;
