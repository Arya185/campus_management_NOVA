const mongoose = require('mongoose');
const uri = "mongodb+srv://nova_app_user:aryamahi09@nova.jvuuzos.mongodb.net/?appName=NOVA".trim();

mongoose.connect(uri, {
  dbName: "ARC",
  bufferCommands: false,
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log("Connected successfully!");
  process.exit(0);
})
.catch((err) => {
  console.error("Connection error:", err);
  process.exit(1);
});
