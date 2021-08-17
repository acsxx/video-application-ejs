const express = require("express");
const { Socket } = require("socket.io");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server)
const { v4: uuidV4 } = require("uuid");
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, { debug: true});
const mongoose = require("mongoose");
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const { ensureAuthenticated, forwardAuthenticated } = require('./config/auth');
//const User = require("./models/User")

//passport config
require('./config/passport')(passport);

//database config
const db = require("./config/keys").MongoURI;

mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true})
.then(() => console.log("MongoDB Connected..."))
.catch(err => console.log(err) )

//ejs
app.set("view engine","ejs");
app.use(express.static("public"));

//bodyParser
app.use(express.urlencoded({ extended: false }));

//express session
app.use( session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// passport middleware
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

//global variables
app.use((req, res, next) =>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})

//Routes
app.use("/users", require("./routes/users"));

//Global vars
var user;
var userSent;
// Dashboard
app.use("/dashboard", ensureAuthenticated, (req, res) => {
  const uniqueRoomId = uuidV4();
  user = req.user;
  if(req.body.roomId1 != null){
    res.render('mainRoom', {user: req.user.name, roomId: req.body.roomId1 })
  }
  else{
    res.render('mainRoom', {user: req.user.name, roomId: uniqueRoomId })
  }

});

//Create room or Join room page
app.use("/create-join", (req,res) =>{
  res.render("createJoin")
})


// Welcome Page
app.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

io.on('connection', socket => {
    socket.on('join-room', (roomId,userId,user) => {
      userSent = user
      socket.join(roomId)
      socket.to(roomId).broadcast.emit('user-connected', userId,user);

      socket.on('message', (message,user) => {
        io.to(roomId).emit('createMessage', message,user)
      });

      socket.on('disconnect', () => {
        socket.to(roomId).broadcast.emit('user-disconnected', userId,userSent)
      })
    })
  })

server.listen(process.env.Port || 5000);
