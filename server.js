const express = require('express');
const app = express();
const authRoute = require('./Routes/Auth.route');
const cors = require("cors");
require("dotenv").config();
require('./db/db');


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/auth', authRoute);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});