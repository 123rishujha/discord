require("dotenv").config();
const mongoose = require("mongoose");

async function connection() {
  try {
    // await mongoose.connect(`${process.env.MONGO_URL}`, {
    await mongoose.connect(`${process.env.MONGO_URL}`,
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
