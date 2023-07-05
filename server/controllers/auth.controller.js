const { User } = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const emailFormateValidator = (email) => {
  const pattern =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return pattern.test(email);
};

const registerController = async (req, res, next) => {
  let { name, email, password } = req.body;
  if (name && email && password) {
    name = name.trim();
    email = email.trim();
    password = password.trim();

    if (!emailFormateValidator(email)) {
      let error = {err: "invalid email formate",statusCode: 400};
      next(error);
      return;
    }

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
