import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import userRoutes from './routes/user.route.js'
import authRoutes from './routes/auth.route.js'

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

app.listen(3000,()=>{
    console.log('Server is running on port 3000!');
})

app.use('/api/user', userRoutes)
app.use('/api/auth', authRoutes)


app.use(express.static(path.join(__dirname,'/SoapDelight.J/dist')))
app.get("*", (req,res)=>{
    res.sendFile(path.join(__dirname,'SoapDelight.J','dist','index.html'))
})

