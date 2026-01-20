import mongoose, { Schema, Document } from "mongoose";


export interface ISubmissionModel extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: string;
  githubLink: string;
  partnerId: string;
  grade: number;
  feedback: string;
}

const submissionSchema = new Schema<ISubmissionModel>(
  {
    assignmentId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Assignment",
    },
    studentId: {
      type: String,
      required: true,
    },
    githubLink: {
      type: String,
      required: true,
    },
    partnerId: {
      type: String,
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        delete ret.__v;

        if (ret.partnerId === null) {
          delete ret.partnerId;
        }

        return ret;
      },
    },
  }
);

submissionSchema.virtual("isGraded").get(function (this: ISubmissionModel) {
  return this.grade != null;
});

export const Submission = mongoose.model<ISubmissionModel>(
  "Submission",
  submissionSchema
);
