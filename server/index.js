require("dotenv").config();
const cors = require("cors");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
      origin: `https://tvgv5n-3000.csb.app`,
      credential: true,
    },
});
// console.log(io);

const { connection } = require("./config/db");

//routes
const authRouter = require("./routes/auth.routes");

app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);

// handling invalid routes
app.all("*", (req, res, next) => {
  let errMessage = `404 Not Found: ${req.url}`;
  next({ err: errMessage, statusCode: 404 });
});

//error handler middleware
app.use((errorObj, req, res, next) => {
  let statusCode = errorObj.statusCode || 400;
  res.status(statusCode).json({
    success: false,
    message: errorObj.err || "something went wrong",
  });
});

const port = 8080;
server.listen(port, async () => {
  try {
    await connection();
    console.log("connected to database");
  } catch (err) {
    console.log("Not connected to database");
  }
  console.log(`running on port ${port}`);
});

//we will store all the active users in a specific room
const activeRooms = {};

io.on("connection", (socket) => {
  console.log("connected to socket", socket.id);

  socket.on("joinRoom", ({ roomName, username }) => {
    //if user is connected to another room the leave that roomName
    if (socket.room) {
      socket.leave(socket.room);
    }

    socket.join(roomName);
    socket.room = roomName;
    socket.username = username;

    //update activeRooms
    if (!activeRooms[roomName]) {
      activeRooms[roomName] = [];
    }
    //update the userList for this particular room
    activeRooms[roomName].push(socket.username);

    io.to(roomName).emit("userList", activeRooms[roomName]);

    // Broadcast the list of active rooms to all clients
    console.log(activeRooms[roomName]);
    io.emit("activeRooms", Object.keys(activeRooms));
  });

  socket.on("chatMessage",(data)=>{
    const {room,text} = data;
    io.to(room).emit("chatMessage",{username:socket.username,message:text});
  })



  socket.on("leaveRoom", () => {
    const roomName = socket.room;

    if (activeRooms[roomName]) {
      activeRooms[roomName] = activeRooms[roomName].filter(
        (elem) => elem != socket.username
      );
    }

    //update the user list for specific room;
    io.to(roomName).emit("userList", activeRooms[roomName]);

    //leave the room;
    socket.leave(roomName);
    socket.room = null;
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    if (socket.room && activeRooms[socket.room]) {
      activeRooms[socket.room] = activeRooms[socket.room].filter(
        (elem) => elem !== socket.username
      );
    }

    //update the user list fro the room;
    console.log(socket.room);
    io.to(socket.room).emit("userList", activeRooms[socket.room]);
  });
  
  
});

/*
so i have implemented the registration and login functionalities please check my code and folder structure once and tell me if there is anything wrong or me can move ahead in our course
my folder structure  for server is now this
 server
      config
            db.js
      controllers
            auth.controller.js
      models
            user.model.js
      routes
            auth.routes.js

      .env
      .gitignore
      index.js
      package-lock.json
      package.json
      
and codes for  each file
filname:-  db.js
require("dotenv").config();
const mongoose = require("mongoose");

async function connection() {
  try {
    // await mongoose.connect(`${process.env.MONGO_URL}`, {
    await mongoose.connect(
      "mongodb+srv://rishu:jha@cluster0.txlyzmp.mongodb.net/discord?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
  } catch (err) {
    console.log("error while connecting to database", err);
  }
}

module.exports = {
  connection,
};

 filname:-  auth.controller.js
const { User } = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerController = async (req, res, next) => {
  let { name, email, password } = req.body;
  if (name && email && password) {
    name = name.trim();
    email = email.trim();
    password = password.trim();

    //creating new document in mongodb database for this user
    try {
      let existingUser = await User.findOne({ email });

      if (existingUser) {
        console.log("user already exist");
        let errMessage = "user already exist";
        let error = { err: errMessage, statusCode: 400 };
        next(error);
        // res.json({success:false})
        return;
      }

      bcrypt.hash(password, 5, async (err, hash) => {
        if (hash) {
          let newUser = new User({ name, email, password: hash });
          let savedUser = await newUser.save();
          res.json({
            status: true,
            message: "registeration successfull",
            user: savedUser,
          });
        } else {
          console.log("err while hasing password", err);
          let errMessage =
            err || "something went wrong while hasing the password";
          let error = { err: errMessage, statusCode: 400 };
          next(error);
          return;
        }
      });
    } catch (err) {
      console.log("err in register controller", err);
      let errMessage = err || "err in register controller";
      let error = { err: errMessage, statusCode: 400 };
      next(error);
    }
  } else {
    console.log("please provide all the field");
    let errMessage = "please provide all the field";
    let error = { err: errMessage, statusCode: 400 };
    next(error);
    return;
  }
};

const loginController = async (req, res, next) => {
  const { email, password } = req.body;
  if (email && password) {
    let findUser = await User.findOne({ email });
    if (findUser) {
      bcrypt.compare(password, findUser.password, async (error, result) => {
        if (result) {
          let token = await jwt.sign(
            { userId: findUser._id },
            process.env.SECRET_KEY
          );
          console.log("token from loginController", token);
          res.json({
            status: true,
            message: "Login Successfull",
            token: token,
          });
        } else {
          console.log("error in loginController while comparing password");
          let message =
            error || "something went wrong while comparing password";
          next({ err: message, statusCode: 400 });
        }
      });
    } else {
      let error = { err: "please provide email and password", statusCode: 400 };
      next(error);
    }
  } else {
    console.log("please provide email and password");
    let error = { err: "please provide email and password", statusCode: 400 };
    next(error);
  }
};

module.exports = {
  registerController,
  loginController,
};

filname:-  user.model.js
const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: mongoose.Schema.Types.Mixed, required: true, unique: true },
  //   password: { required: true, unique: true },
});

const User = mongoose.model("user", userSchema);

module.exports = {
  User,
};

filname:-  auth.routes.js
const express = require("express");
const { registerController } = require("../controllers/auth.controller");
const { loginController }  = require("../controllers/auth.controller");


const router = express.Router();

router.post("/register",registerController);
router.post("/login",loginController);

module.exports = router;

filname:-  .env

MONGO_URL=mongodb+srv://rishu:bha@cluster0.txlyzmp.mongodb.net/discord?retryWrites=true&w=majority
SECRET_KEY = discord_secrets

filname:-  index.js
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
// console.log(io);

const { connection } = require("./config/db");

//routes
const authRouter = require("./routes/auth.routes");

app.use(express.json());

app.use("/auth", authRouter);

// handling invalid routes
app.all("*", (req, res, next) => {
  let errMessage = `404 Not Found: ${req.url}`;
  next({ err: errMessage, statusCode: 404 });
});

//error handler middleware
app.use((errorObj, req, res, next) => {
  let statusCode = errorObj.statusCode || 400;
  res.status(statusCode).json({
    success: false,
    message: errorObj.err || "something went wrong",
  });
});

const port = 8080;
server.listen(port, async () => {
  try {
    await connection();
    console.log("connected to database");
  } catch (err) {
    console.log("Not connected to database");
  }
  console.log(`running on port ${port}`);
});



just give me suggestion if any and move ahead in our course

 */
