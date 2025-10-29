import mongoose, { Schema, Document } from 'mongoose';
import { IParent } from './parent.model';

export interface IStudent extends Document {
  name: string;
  old: number;
  classstudent: string;
  parentId: IParent['_id'];
}

const studentSchema: Schema<IStudent> = new Schema({
  name: { type: String, required: true },
  old: { type: Number, required: true, min: 0 },
  classstudent: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
}, { timestamps: true });

export default mongoose.models.Student || mongoose.models.Student || mongoose.model<IStudent>('Student', studentSchema);
