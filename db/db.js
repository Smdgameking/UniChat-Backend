const mongoose = require("mongoose");

mongoose.connect(process.env.MongoURL)
.then(() => {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.log(err);
});

module.exports = mongoose;