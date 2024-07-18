import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors'
dotenv.config();

const app = express();
const __dirname = path.resolve();



app.use(
  cors({
    origin: ["http://localhost:3000","https://soapdelight-j.onrender.com"],
    credentials: true,
  })
);

app.use(express.static(path.join(__dirname, '/SoapDelight.J/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'SoapDelight.J', 'dist', 'index.html'));
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(bodyParser.json());
// app.use(express.json());

// app.use(cookieParser());

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);


app.get("/", (req, res) => {
  res.send("Home Page");
});

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log(err);
  });



// const __dirname = path.resolve();



// app.use(express.static(path.join(__dirname, '/client/dist')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
// });



app.listen(3000, () => {
  console.log('Server listening on port 3000');
});



app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});