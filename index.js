const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

const mongoose = require("mongoose")
mongoose.connect("mongodb+srv://superuser:12345@cluster0.4f2rp.mongodb.net/?retryWrites=true&w=majority")

const User = mongoose.model("User", {
  username: String
})

const Exercise = mongoose.model("Exercise", {
  username: String,
  description: String,
  duration: Number,
  date: String
})

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", (req, res) => {
  new User({username: req.body.username}).save().then(user => {
    res.send({username: user.username, _id: user._id})
  })
})

app.post("/api/users/:_id/exercises", (req, res) => {
  let userDate = req.body.date;
  if (!userDate) {
    userDate = new Date().toDateString();
  } else {
    userDate = new Date(userDate).toDateString();
  }
  User.findById(req.params._id, function(err, data) {
    if (data != null) {
      new Exercise({
        userid: req.params._id,
        username: data.username,
        date: userDate,
        duration: parseInt(req.body.duration),
        description: req.body.description
      }).save().then(exercise => {
        res.send({_id: req.params._id, username: exercise.username, date: userDate, duration: parseInt(req.body.duration), description: req.body.description})
      })
    }
  });
})

app.get("/api/users", (req, res) => {
  User.find({}, function(err, users) {
    res.send(users);
  })
})

app.get("/api/users/:_id/logs?", (req, res) => {
  var from = false;
  var to = false;
  var limit = false;
  var logObjLength = 0;
  User.findById(req.params._id, function(err, user) {
    Exercise.find({username: user.username}, function(err, exercises) {
      function filter() {
        class Obj {
          constructor(description, duration, date) {
              this.description = description,
              this.duration = duration,
              this.date = date;
          }
        }
        let arr = [];
        if (req.query.limit !== undefined) {
          var intLimit = parseInt(req.query.limit);
        }
        mainLoop: for (let i = 0; i < exercises.length; i++) {
          if (req.query.from !== undefined && req.query.to !== undefined && req.query.limit !== undefined) {
            if ( Date.parse(exercises[i].date) >= Date.parse(new Date(req.query.from).toDateString()) 
            && Date.parse(exercises[i].date) <= Date.parse(new Date(req.query.to).toDateString()) ) {
              from = true;
              to = true;
              limit = true;
              
              if (intLimit <= 1) {
                let object = new Obj(exercises[i].description, exercises[i].duration, exercises[i].date);
                arr.push(object);
                break mainLoop;
              } else if (intLimit > 0) {
                let object = new Obj(exercises[i].description, exercises[i].duration, exercises[i].date);
                arr.push(object);
                intLimit--;
              }
              
            }
          } else if (req.query.from !== undefined && req.query.to !== undefined) {
            if ( Date.parse(exercises[i].date) >= Date.parse(new Date(req.query.from).toDateString()) 
            && Date.parse(exercises[i].date) <= Date.parse(new Date(req.query.to).toDateString()) ) {
              from = true;
              to = true;
              let object = new Obj(exercises[i].description, exercises[i].duration, exercises[i].date);
              arr.push(object);
            }
          } else if (req.query.from !== undefined && req.query.to === undefined) {
            if (Date.parse(new Date(req.query.from).toDateString()) <= Date.parse(exercises[i].date)) {
              from = true;
              let object = new Obj(exercises[i].description, exercises[i].duration, exercises[i].date);
              arr.push(object);
            }
          } else if (req.query.from === undefined && req.query.to !== undefined) {
            if (Date.parse(new Date(req.query.to).toDateString()) >= Date.parse(exercises[i].date)) {
              to = true;
              let object = new Obj(exercises[i].description, exercises[i].duration, exercises[i].date);
              arr.push(object);
            }
          } else if (req.query.from === undefined && req.query.to === undefined && req.query.limit !== undefined) {
            limit = true;
            if (intLimit <= 1) {
              let object = new Obj(exercises[i].description, exercises[i].duration, exercises[i].date);
              arr.push(object);
              break mainLoop;
            } else if (intLimit > 0) {
              let object = new Obj(exercises[i].description, exercises[i].duration, exercises[i].date);
              arr.push(object);
              intLimit--;
            }
          } else {
            let object = new Obj(exercises[i].description, exercises[i].duration, exercises[i].date);
            arr.push(object);
          }
        }
        logObjLength = arr.length;
        return arr;
      }
      let logObj = filter();
      let sendObject = {_id: req.params._id, username: exercises[0].username, count: logObjLength, log: logObj};
      res.send(sendObject);
      /* To add additional key-value pair to sendObject...
      if (from === true && to === true && limit === true) {
        let keyValues = Object.entries(sendObject);
        keyValues.splice(2, 0, ["from", new Date(req.query.from).toDateString()], ["to", new Date(req.query.to).toDateString()])
        let newSendObject = Object.fromEntries(keyValues);
        res.send(newSendObject);
      } else if (from === true && to === true) {
        let keyValues = Object.entries(sendObject);
        keyValues.splice(2, 0, ["from", new Date(req.query.from).toDateString()], ["to", new Date(req.query.to).toDateString()])
        let newSendObject = Object.fromEntries(keyValues);
        res.send(newSendObject);
      } else if (from === true && to === false) {
        let keyValues = Object.entries(sendObject);
        keyValues.splice(2, 0, ["from", new Date(req.query.from).toDateString()])
        let newSendObject = Object.fromEntries(keyValues);
        res.send(newSendObject);
      } else {
        res.send(sendObject);
      }
      */
    })
  })
  
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})