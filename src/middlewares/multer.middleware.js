import multer from "multer";

const storage = multer.diskStorage(
  {
    destination: function(req, file, cb){
      cb(null, './public/temp')  // null because we don't want to manage errors
    },
    filename: function(req, file, cb){
      cb(null, file.originalname)
    }
  }
)

export const upload = multer({
  storage: storage
})