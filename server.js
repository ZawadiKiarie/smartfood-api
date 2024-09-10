const express = require('express');
const app = express();
const multer = require('multer');
const image = require('./controllers/image')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage })

app.get('/', (req, res) => {res.send('success')})

app.post('/upload', upload.single('image'), async(req, res)=> {
  if(!req.file){
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try{
    const results = await image.uploadImage(req.file.path);
    res.status(200).json(results)
  }catch(error){
    res.status(500).json({ error: 'Error uploading image'});
  }
})

app.listen(3000, ()=>{
  console.log('app is running on port 3000');
})