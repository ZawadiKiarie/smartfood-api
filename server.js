const express = require('express');
const app = express();
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcrypt');
const knex = require('knex');

const image = require('./controllers/image')
const register = require('./controllers/register')
const signIn = require('./controllers/signin')
const profile = require('./controllers/profile')

const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: 'zawadi2005',
    database: 'smartfood'
  },
})

app.use(express.json());
app.use(cors());

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

app.post('/signup', register.handleRegister(db, bcrypt))

app.post('/signin', (req, res) => {signIn.handleSignIn(req, res, db, bcrypt)});

app.get('/profile/:id', (req, res) => {profile.handleProfileGet(req, res, db)})

app.listen(3000, ()=>{
  console.log('app is running on port 3000');
})