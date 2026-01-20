import { ISubmissionModel, Submission } from "./SubmissionModel";
import { logger } from "../../Utils/Logger";
import mongoose from "mongoose";

export const populateSubmission = (query: any) => {
  return query.populate("assignmentId", "title description");
};

export class SubmissionService {
  async createSubmission(
    submissionData: Partial<ISubmissionModel>
  ): Promise<ISubmissionModel> {
    try {
      if (submissionData.assignmentId && typeof submissionData.assignmentId === 'string') {
        submissionData.assignmentId = new mongoose.Types.ObjectId(submissionData.assignmentId);
      }
      
      const created = await Submission.create(submissionData);
      logger.info("Submission created successfully.");
      const query = Submission.findById(created._id);
      const populatedSubmission = await populateSubmission(query);
      return populatedSubmission;
    } catch (error: unknown) {
      throw new Error(
        "Error creating submission: " +
          (error && typeof (error as any).message === "string"
            ? (error as any).message
            : String(error))
      );
    }
  }
  
  async getAllSubmissions(): Promise<ISubmissionModel[]> {
    try {
      const query = Submission.find();
      const populatedQuery = populateSubmission(query);
      const submissions = await populatedQuery;
      return submissions;
    } catch (error) {
      throw new Error(
        "Error finding all submissions: " +
          (error && typeof (error as any).message === "string"
            ? (error as any).message
            : String(error))
      );
    }
  }

  async findSubmissionByIds(
    studentId: string,
    assignmentId: mongoose.Types.ObjectId
  ): Promise<ISubmissionModel> {
    try {
      const submission = await Submission.findOne({
        studentId: studentId,
        assignmentId: assignmentId,
      });
      if (!submission) {
        throw new Error("Submission not found");
      }
      return submission;
    } catch (error) {
      throw new Error("Error finding submission by ID");
    }
  }

  async gradingAndFeedback(
    submission: ISubmissionModel,
    grade: number,
    feedback?: string
  ) {
    try {
      if (grade === undefined || grade === null) {
        throw new Error("Grade is required");
      }
      if (grade > 100 || grade < 0) {
        throw new Error("Grade must be between 0 and 100");
      }
      submission.grade = grade;
      submission.feedback = feedback ? feedback : "Checked.";
      await submission.save();
    } catch (error) {
      throw new Error("Error updating grade and feedback");
    }
  }
  
  async getAverageGradesPerAssignment(): Promise<
    {
      assignmentId: mongoose.Types.ObjectId;
      average: number;
    }[]
  > {
    try {
      const result = await Submission.aggregate([
        { $match: { grade: { $exists: true, $ne: null } } },
        { $group: { _id: "$assignmentId", average: { $avg: "$grade" } } },
        { $project: { assignmentId: "$_id", average: 1, _id: 0 } },
      ]);
      return result;
    } catch (error) {
      throw new Error("Error calculating average grade per assignment");
    }
  }

  async getAllStudentsSubmissions(studentId: string): Promise<any[]> {
    try {
      const query = Submission.find({
        $or: [{ studentId: studentId }, { partnerId: studentId }],
      });
      const studentsSubmissions = await populateSubmission(query);
      const allClassAverage = await this.getAverageGradesPerAssignment();
      const result = [];
      
      for (const submission of studentsSubmissions) {
        const submissionObj = submission.toObject();
        const assignmentIdString = submission.assignmentId._id ? 
          submission.assignmentId._id.toString() : 
          submission.assignmentId.toString();
          
        submissionObj.classAverage =
          allClassAverage.find(
            (avg) => avg.assignmentId.toString() === assignmentIdString
          )?.average || null;
        result.push(submissionObj);
      }

      return result;
    } catch (error) {
      throw new Error("Error fetching your submission: " + error);
    }
  }
}

export const submissionService = new SubmissionService();
