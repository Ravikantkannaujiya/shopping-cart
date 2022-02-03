const express = require('express');
var bodyParser = require('body-parser');

const route = require('./routes/route.js');
var multer = require('multer')

const app = express();



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any())

const mongoose = require('mongoose')



mongoose.connect("mongodb+srv://users-open-to-all:hiPassword123@cluster0.uh35t.mongodb.net/RRHA_Group16DB?retryWrites=true&w=majority", { useNewUrlParser: true })
    .then(() => console.log('mongodb working on 3000'))
    .catch(err => console.log(err))
   

app.use('/', route);


app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});