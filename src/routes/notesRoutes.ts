import express from "express";
const router = express.Router();

import {
  getAllNotesFromUser,
  getNote,
  addNote,
  updateNote,
  deleteNote,
} from "../controllers/notesController.js";

router.route("/").get(getAllNotesFromUser).post(addNote);

router.route("/:id").get(getNote).patch(updateNote).delete(deleteNote);

export default router;
