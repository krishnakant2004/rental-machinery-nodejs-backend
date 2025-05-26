const multer = require('multer');
const path = require('path');


const storageMachinery = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, './public/machinery');
    },
    filename: function(req, file, cb) {
      // Check file type based on its extension
      const filetypes = /jpeg|jpg|png/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
      if (extname) {
        cb(null, Date.now() + "_" + file.originalname);
      } else {
        cb("Error: only .jpeg, .jpg, .png files are allowed!");
      }
    }
  });

  const uploadMachinery = multer({
    storage: storageMachinery,
    limits: {
      fileSize: 1024 * 1024 * 5 // limit filesize to 5MB
    },
  });


  module.exports = {uploadMachinery};