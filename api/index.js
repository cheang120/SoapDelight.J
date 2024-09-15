import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import transactionRoute from "./routes/transactionRoute.js"
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import productRoute from './routes/productRoute.js'
import orderRoute  from "./routes/orderRoute.js";
import categoryRoute from'./routes/categoryRoute.js'
import brandRoute from './routes/brandRoute.js'
import couponRoute from './routes/couponRoute.js'
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import { EventEmitter } from 'events';


dotenv.config();

const app = express();
const __dirname = path.resolve();


EventEmitter.defaultMaxListeners = 20;


// CORS 配置
app.use(
  cors({
    origin: ["http://localhost:5173", "https://soapdelight-j.onrender.com","https://soapdelight-j.store"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
    allowedHeaders: ['Authorization', 'Content-Type', 'On-behalf-of', 'x-sg-elas-acl'],
    credentials: true,
  })
);

app.use(express.static(path.join(__dirname, '/SoapDelight.J/dist')));


app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// app.use("/api/transaction", transactionRoute);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoute);
app.use("/api/category", categoryRoute);
app.use("/api/brand", brandRoute)
app.use("/api/coupon", couponRoute)
app.use("/api/order", orderRoute)


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'SoapDelight.J', 'dist', 'index.html'));
});

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