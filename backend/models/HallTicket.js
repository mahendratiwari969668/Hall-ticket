const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      trim: true,
      default: "",
    },
    subjectName: {
      type: String,
      trim: true,
      default: "",
    },
    examDate: {
      type: String,
      trim: true,
      default: "",
    },
    timings: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const hallTicketSchema = new mongoose.Schema(
  {
    profileName: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled Profile",
    },
    profileNameKey: {
      type: String,
      required: true,
      select: false,
    },
    rollNoKey: {
      type: String,
      select: false,
    },
    examSession: {
      type: String,
      trim: true,
      default: "",
    },
    rollNo: {
      type: String,
      trim: true,
      default: "",
    },
    candidateName: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      trim: true,
      default: "",
    },
    fatherName: {
      type: String,
      trim: true,
      default: "",
    },
    course: {
      type: String,
      trim: true,
      default: "",
    },
    semester: {
      type: String,
      trim: true,
      default: "",
    },
    candidatePhoto: {
      type: String,
      default: "",
    },
    candidateSignature: {
      type: String,
      default: "",
    },
    subjects: {
      type: [subjectSchema],
      default: [],
    },
    printDateTime: {
      type: String,
      trim: true,
      default: "",
    },
    pageInfo: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

hallTicketSchema.index({ profileNameKey: 1 }, { unique: true });
hallTicketSchema.index({ rollNoKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("HallTicket", hallTicketSchema);
