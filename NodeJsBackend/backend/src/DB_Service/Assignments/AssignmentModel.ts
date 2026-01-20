import mongoose, { Schema, Document } from "mongoose";

export interface IAssignmentModel extends Document {
  title: string;
  description: string;
  deadline: Date;
}

const assignmentSchema = new Schema<IAssignmentModel>(
  {
    title: {
      type: String,
      required: true,
      default: "untitled",
    },
    description: {
      type: String,
    },
    deadline: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: true,
    },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        delete ret.__v;
        delete ret._id;
        ret.id = _doc._id;
        return ret;
      },
    },
  }
);

assignmentSchema.virtual("isOpen").get(function (this: IAssignmentModel) {
  if (!this.deadline) {
    return true;
  }
  return this.deadline.getTime() > Date.now();
});

export const Assignment = mongoose.model<IAssignmentModel>(
  "Assignment",
  assignmentSchema
);
