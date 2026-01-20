import { Assignment, IAssignmentModel } from "./assignmentModel";

class AssignmentService {
  async createAssignment(
    assignmentInfo: IAssignmentModel
  ): Promise<IAssignmentModel> {
    const assignment = new Assignment(assignmentInfo);
    try {
      return await assignment.save();
    } catch (error: unknown) {
      throw new Error(
        "Creating assignment failed: " +
          (error && typeof (error as any).message === "string"
            ? (error as any).message
            : String(error))
      );
    }
  }

  async getOpenAssignments(): Promise<IAssignmentModel[]> {
    try {
      const assignments = await Assignment.find({
        $or: [
          { deadline: { $exists: false } },
          { deadline: { $gt: new Date() } },
        ],
      });
      return assignments;
    } catch (error) {
      throw new Error("Error fetching open assignments: " + error);
    }
  }

  async getAllAssignments(): Promise<IAssignmentModel[]> {
    try {
      const assignments = await Assignment.find({});
      return assignments;
    } catch (error) {
      throw new Error("Error fetching all assignments: " + error);
    }
  }
}

export const assignmentService = new AssignmentService();
