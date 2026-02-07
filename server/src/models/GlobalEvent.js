// models/GlobalEvent.js
const globalEventSchema = new mongoose.Schema({
  title: String,
  start: Date,
  end: Date,
  type: String,
  dept: String,
  year: Number,
  location: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isGlobal: { type: Boolean, default: true }
}, { timestamps: true });
