const express = require("express");
const mongoose = require("mongoose");
const HallTicket = require("../models/HallTicket");

const router = express.Router();

const allowedFields = [
  "profileName",
  "examSession",
  "rollNo",
  "candidateName",
  "gender",
  "fatherName",
  "course",
  "semester",
  "candidatePhoto",
  "candidateSignature",
  "subjects",
  "printDateTime",
  "pageInfo",
];

function cleanString(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalizeKey(value) {
  const cleaned = cleanString(value).toLowerCase();
  return cleaned || undefined;
}

function sanitizeSubjects(subjects) {
  if (!Array.isArray(subjects)) return [];

  return subjects.map((subject) => ({
    subjectCode: cleanString(subject.subjectCode),
    subjectName: cleanString(subject.subjectName),
    examDate: cleanString(subject.examDate),
    timings: cleanString(subject.timings),
  }));
}

function buildProfilePayload(body) {
  const payload = allowedFields.reduce((profile, field) => {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      return profile;
    }

    profile[field] = field === "subjects" ? sanitizeSubjects(body[field]) : body[field];
    return profile;
  }, {});

  payload.profileName =
    cleanString(payload.profileName) ||
    cleanString(payload.candidateName) ||
    cleanString(payload.rollNo) ||
    "Untitled Profile";

  payload.examSession = cleanString(payload.examSession);
  payload.rollNo = cleanString(payload.rollNo);
  payload.candidateName = cleanString(payload.candidateName);
  payload.gender = cleanString(payload.gender);
  payload.fatherName = cleanString(payload.fatherName);
  payload.course = cleanString(payload.course);
  payload.semester = cleanString(payload.semester);
  payload.printDateTime = cleanString(payload.printDateTime);
  payload.pageInfo = cleanString(payload.pageInfo);
  payload.candidatePhoto = typeof payload.candidatePhoto === "string" ? payload.candidatePhoto : "";
  payload.candidateSignature =
    typeof payload.candidateSignature === "string" ? payload.candidateSignature : "";
  payload.subjects = sanitizeSubjects(payload.subjects);
  payload.profileNameKey = normalizeKey(payload.profileName);
  payload.rollNoKey = normalizeKey(payload.rollNo);

  return payload;
}

function buildDuplicateConditions(payload) {
  return [
    payload.profileNameKey ? { profileNameKey: payload.profileNameKey } : null,
    payload.rollNoKey ? { rollNoKey: payload.rollNoKey } : null,
  ].filter(Boolean);
}

function buildUpdateOperation(payload) {
  const update = { $set: { ...payload } };

  if (payload.rollNoKey === undefined) {
    delete update.$set.rollNoKey;
    update.$unset = { rollNoKey: "" };
  }

  return update;
}

function profileSummary(profile) {
  return {
    _id: profile._id,
    profileName: profile.profileName || profile.candidateName || profile.rollNo || "Untitled Profile",
    rollNo: profile.rollNo || "",
    candidateName: profile.candidateName || "",
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function publicProfile(profile) {
  const plainProfile = typeof profile.toObject === "function" ? profile.toObject() : profile;
  const { profileNameKey, rollNoKey, __v, ...publicData } = plainProfile;
  return publicData;
}

function validateObjectId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid profile id" });
  }

  next();
}

function duplicateProfileError(error) {
  if (error.code !== 11000) return error;

  error.status = 409;
  error.message = "A profile with this name or roll number already exists.";
  return error;
}

router.get("/profiles", async (req, res, next) => {
  try {
    const profiles = await HallTicket.find({})
      .sort({ updatedAt: -1 })
      .select("profileName rollNo candidateName createdAt updatedAt")
      .lean();

    res.status(200).json({
      profiles: profiles.map(profileSummary),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/profile/:id", validateObjectId, async (req, res, next) => {
  try {
    const profile = await HallTicket.findById(req.params.id).lean();

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({ profile: publicProfile(profile) });
  } catch (error) {
    next(error);
  }
});

router.post("/profile", async (req, res, next) => {
  try {
    const payload = buildProfilePayload(req.body);
    const duplicateConditions = buildDuplicateConditions(payload);
    const existingProfile = duplicateConditions.length
      ? await HallTicket.findOne({ $or: duplicateConditions }).select("_id").lean()
      : null;

    if (existingProfile) {
      const profile = await HallTicket.findByIdAndUpdate(
        existingProfile._id,
        buildUpdateOperation(payload),
        {
          new: true,
          runValidators: true,
        }
      ).lean();

      return res.status(200).json({
        message: "Profile Updated",
        profile: publicProfile(profile),
      });
    }

    const profile = await HallTicket.create(payload);

    res.status(201).json({
      message: "Profile Saved",
      profile: publicProfile(profile),
    });
  } catch (error) {
    next(duplicateProfileError(error));
  }
});

router.put("/profile/:id", validateObjectId, async (req, res, next) => {
  try {
    const payload = buildProfilePayload(req.body);
    const duplicateConditions = buildDuplicateConditions(payload);

    if (duplicateConditions.length) {
      const duplicateProfile = await HallTicket.findOne({
        _id: { $ne: req.params.id },
        $or: duplicateConditions,
      })
        .select("_id")
        .lean();

      if (duplicateProfile) {
        return res.status(409).json({
          message: "A profile with this name or roll number already exists.",
        });
      }
    }

    const profile = await HallTicket.findByIdAndUpdate(
      req.params.id,
      buildUpdateOperation(payload),
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({
      message: "Profile Updated",
      profile: publicProfile(profile),
    });
  } catch (error) {
    next(duplicateProfileError(error));
  }
});

router.delete("/profile/:id", validateObjectId, async (req, res, next) => {
  try {
    const profile = await HallTicket.findByIdAndDelete(req.params.id).lean();

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({
      message: "Profile Deleted",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
