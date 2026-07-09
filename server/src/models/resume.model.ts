import { Schema, model } from 'mongoose';
import { ResumeJSON } from '../types/resume';

export interface IResumeDocument {
  fileName: string;
  resumeData: ResumeJSON;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResumeDocument>(
  {
    fileName: { type: String, required: true },
    resumeData: { type: Schema.Types.Mixed, required: true }
  },
  {
    timestamps: true
  }
);

export const Resume = model<IResumeDocument>('Resume', ResumeSchema);
export default Resume;
