import express from 'express'
const router = express.Router()

import {
    getAllNotes,
    getNote,
    addNote,
    updateNote,
    deleteNote
} from '../controllers/notesController.js'

router.route('/')
    .get(getAllNotes)
    .post(addNote)

router.route('/:id')
    .get(getNote)
    .patch(updateNote)
    .delete(deleteNote)

export default router