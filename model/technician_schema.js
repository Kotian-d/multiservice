import mongoose from 'mongoose';

const TehnicianSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String,
    unique: true,
    required: true 
  },
  lat: { 
    type: Number, 
    default: 0.0 
  },
  long: { 
    type: Number, 
    default: 0.0 
  },
  currentlocation: { 
    type: String, 
    default: ''
  },
  status: { 
    type: String, 
    default: "active",
    enum: ["active", "inactive", "busy"] 
  },
  rating: { 
    type: Number, 
    default: 0.0 
  },
  technicianId: { 
    type: String,
  },
}, { timestamps: true });

export const Technician = mongoose.model('Technician', TehnicianSchema);