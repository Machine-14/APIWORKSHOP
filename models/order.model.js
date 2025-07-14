const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'products', required: true },
  order: { type: Number, default: 0 } 
},{ 
  timestamps: true 
});

module.exports = mongoose.model('orders', orderSchema);