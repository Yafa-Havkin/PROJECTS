import { Router, Request, Response } from "express";
import { roleMiddleware } from "../../Middleware/AuthorizationMid";
import { authenticate } from "../../Middleware/AuthenticationMid";
import { Role } from "../../DB_Service/Users/UserModel";
import { assignmentService } from "../../DB_Service/Assignments/AssignmentsService";
import { submissionService } from "../../DB_Service/Submission/SubmissionService";
import { logger } from "../../Utils/Logger";

const router = Router();

router.use(authenticate);
router.use(roleMiddleware(Role.student));

router.get("/assignments", async (req: Request, res: Response) => {
  try {
    const assignments = await assignmentService.getOpenAssignments();
    return res.status(200).send({ "Your open assignments": assignments });
  } catch (error) {
    throw new Error("Error fetching open assignments");
  }
});

router.post("/submissions", async (req: Request, res: Response) => {
  try {
    const { assignmentId, githubLink, partnerId } = req.body;
    const studentId = (req as any).userId;
    const submission = {
      studentId,
      assignmentId,
      githubLink,
      partnerId,
    };
    
    await submissionService.createSubmission(submission);
    logger.info("Submission created successfully.");
    return res.status(201).send({ submission });
  } catch (error) {
    throw new Error("Error creating submission");
  }
});

router.get("/submissions/me/", async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).userId;
    const submissions = await submissionService.getAllStudentsSubmissions(
      studentId
    );
    return res.status(200).send({ "Your submissions": submissions });
  } catch (error) {
    throw new Error("Error fetching your submissions");
  }
});

export default router;
