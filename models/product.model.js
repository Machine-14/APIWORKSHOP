const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema(
  { 
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    image: { type: String, default: "" },
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model('products', productSchema);