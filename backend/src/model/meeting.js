import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  meetingCode: {           // ✅ matches frontend & controller
    type: String,
    required: true,
  },
  date: {                  // ✅ lowercase + Date type
    type: Date,
    default: Date.now,
  },
});

const Meeting = mongoose.model("Meeting", meetingSchema);
export { Meeting };
