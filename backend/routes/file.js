const express = require('express');
const multer = require('multer');
const File = require('../models/File');
const auth = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

module.exports = (io) => {
  router.post('/upload', auth, upload.single('file'), async (req, res) => {
    const { receiver } = req.body;
    const sender = req.user.username;

    if (!receiver) {
      return res.status(400).send('Receiver username is required');
    }

    const file = new File({
      filename: req.file.filename,
      sender,
      receiver,
      path: req.file.path
    });

    await file.save();

    io.to(receiver).emit('receiveFile', { filename: file.filename, sender });
    io.to(sender).emit('fileUploaded', { filename: file.filename, receiver });

    res.send(file);
  });

  return router;
};
