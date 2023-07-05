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
