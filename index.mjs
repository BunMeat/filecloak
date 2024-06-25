import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
const app = express();

app.use(express.static('public'));

app.get('/api/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASEKEY,
    authDomain: process.env.FIREBASEAUTHDOMAIN,
    projectId: process.env.PROJECTID,
    storageBucket: process.env.STORAGEBUCKET,
    messagingSenderId: process.env.MESSAGINGSENDERID,
    appId: process.env.APPID
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
