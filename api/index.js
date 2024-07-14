import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import userRoutes from './routes/user.route.js'
import authRoutes from './routes/auth.route.js'
import  cookieParser from 'cookie-parser';
// import  nodemailer from "nodemailer";
import  cors from 'cors';
import  bodyParser from "body-parser"



dotenv.config()

mongoose
    .connect(process.env.MONGO)
    .then(()=>{
        console.log('MongoDb is connected');
    })
    .catch((err)=>{
        console.log(err);
    })

    const __dirname = path.resolve()


const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(cors());

app.listen(3000,()=>{
    console.log('Server is running on port 3000!');
})

app.use(
    cors({
        origin:["http://localhost:5173"],
        credentials:true
    })
)

app.use('/api/user', userRoutes)
app.use('/api/auth', authRoutes)

app.use((err, req,res,next)=>{
    const statusCode = err.statusCode || 500
    const message = err.message || 'Internal Server Error'
    res.status(statusCode).json({
        success:false,
        statusCode,
        message
    })
})


app.use(express.static(path.join(__dirname,'/SoapDelight.J/dist')))
app.get("*", (req,res)=>{
    res.sendFile(path.join(__dirname,'SoapDelight.J','dist','index.html'))
})

