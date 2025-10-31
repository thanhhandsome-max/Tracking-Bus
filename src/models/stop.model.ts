import mongoose, { Schema, Document,ObjectId } from 'mongoose';

// Sử dụng GeoJSON để lưu trữ location hiệu quả hơn
interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IStop extends Document {
  _id:ObjectId;
  name: string;
  address: string;
  location: ILocation;
}

const stopSchema: Schema<IStop> = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  }
});

// Tạo index cho truy vấn không gian
stopSchema.index({ location: '2dsphere' });

export default mongoose.model<IStop>('Stop', stopSchema);