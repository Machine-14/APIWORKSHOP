const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
  console.log("Connecting to DB...") 
  await mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log("Connected to DB success");
}