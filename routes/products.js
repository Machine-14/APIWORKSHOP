var express = require('express');
var router = express.Router();
var productSchema = require('../models/product.model');
const orderSchema = require('../models/order.model');
const jwt = require('jsonwebtoken');
const tokenMiddleware = require('../middleware/token.middleware');


// แสดง product ทั้งหมด

router.get('/products', tokenMiddleware ,async (req, res) => {
  try {
    const products = await productSchema.find();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// แสดง product ตาม  

router.get('/products/:id', tokenMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productSchema.findById(id);
    
    if (!product) { 
      return res.status(404).json({ error: 'ไม่เจอ Product' });
    }
    
    res.status(200).json(product);
  }
  catch (error) {
    console.error("eror fetching product:", error);  
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// เพิ่ม product ใหม่

router.post('/products', async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    if (!name || !price || !stock) {
      return res.status(400).json({ error: 'จำเป็นต้องกรอก Name, price, และ stock' });
    }

    const newProduct = new productSchema({ name, price, stock });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// อัพเดท product เฉพาะ :id ที่ต้องการ

router.put('/products/:id', tokenMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock } = req.body;

    if (!name && !price && !stock) {
      return res.status(400).json({ error: 'ต้องแก้ไขอย่างน้อย 1 อย่าง (name, price, stock) ' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (stock) updateData.stock = stock;

    const updatedProduct = await productSchema.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedProduct) {
      return res.status(404).json({ error: 'ไม่เจอ Product' });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ลบรายการ product เฉพาะ :id ที่ต้องการ

router.delete('/products/:id', tokenMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await productSchema.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return res.status(404).json({ error: 'ไม่เจอ Product' });
    }

    res.status(200).json({ message: 'ลบ Product สำเร็จ' });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}); 

// เพิ่ม order ให้แต่ละ product

router.post('/products/:id/orders', tokenMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { order } = req.body;

    // ตรวจสอบข้อมูลที่ส่งมา
    if (typeof order !== 'number') {
      return res.status(400).json({ error: 'จำเป็นต้องกรอกจำนวน order' });
    }

    // ตรวจสอบว่าสินค้ามีอยู่จริงหรือไม่
    const product = await productSchema.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'ไม่เจอ Product' });
    }

    // ตรวจสอบว่า order ไม่เกิน stock
    if (order > product.stock) {
      return res.status(400).json({ error: 'Stock สินค้าที่มีไม่เพียงพอสำหรับจำนวน order' });
    }

    // สร้าง order ใหม่
    const newOrder = new orderSchema({
      product: id,
      order: order
    });

    await newOrder.save();

    // อัปเดต stock ของสินค้าตาม order

    product.stock -= order;
    await product.save();

    res.status(201).json({
      message: 'สร้างรายการ Order สำเร็จ',
      order: {
        id: newOrder._id,
        product: product.name,
        order: newOrder.order
      }
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// แสดง order ของแต่ละ product

router.get('/products/:id/orders', tokenMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await orderSchema.find({ product: id })
      .populate('product', 'name') // ดึงเฉพาะชื่อสินค้า
      .select('product order'); // ดึงเฉพาะฟิลด์ product และ order

    const result = orders.map(order => ({
      productName: order.product?.name,
      order: order.order
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching orders for product:", error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// แสดง order ทุกรายการ
router.get('/orders', tokenMiddleware, async (req, res) => {
  try {
    const orders = await orderSchema.find()
      .populate('product', 'name') // ดึงชื่อสินค้า
      .select('product order');     // ดึงเฉพาะฟิลด์ product และ order

    const result = orders.map(order => ({
      productName: order.product?.name,
      orderAmout: order.order
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("ล้มเหลวในการค้นหา orders ทั้งหมด:", error);
    res.status(500).json({ error: 'Internal server error.' });
  }

});

module.exports = router;