// require('dotenv').config({path: './env'})

import dotenv from 'dotenv'  //to write this import syntax, experimental feature is used.Check json file/ scripts/ dev
import connectDB from './db/index.js';
import {app} from './app.js';

dotenv.config(
  {
    path: './.env'
  }
)

connectDB()
.then(() => {
  app.listen(process.env.PORT || 8000, () => {
    console.log(`app is successfully listening on port: ${process.env.PORT}`)
  })

  app.on("error", (err) => {
    console.log('MONGODB connection failed!!', err)
  })
})
.catch((err) => {
  console.log('MONGODB connection failed!!', err)
})























/*
;(
  async() => {
  try{
    await mongoose.connect(`${process.env.MONFODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.error('ERROR: ', error)
      throw error
    });

    app.listen(process.env.PORT, () => {
      console.log(`app is listening on ${process.env.port}`);
    })
  } catch (error){
    console.error('ERROR: ', error)
    process.exit(1);
  }
}
)();
*/