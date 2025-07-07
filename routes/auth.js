var express = require('express');
var router = express.Router();
var userSchema = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  try {
    // เช็คเมลซ้ำ
    const existingUser = await userSchema.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: ' สมัครไม่สำเร็จ มี Email นี้ในระบบแล้ว' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = new userSchema({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword
    });
    
    await newUser.save();
    res.status(201).json({ message: 'สมัครสำเร็จรอ approve' });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดระหว่างการสมัคร :", error);
    res.status(500).json({ error: 'ไม่ทราบสาเหตุ' });
  }
});

router.post('/login', async (req, res) => { 
  try {
    // เช็คอีเมลหรือ username ใน db
    const user = await userSchema.findOne({ $or: [{ email: req.body.email }, { username: req.body.username }] });
    if (!user) {
      return res.status(401).json({ error: 'ไม่เจอ Email หรือ Username ในระบบ กรุณาสมัครเพื่อเข้าใช้งาน' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'บัญชีของคุณยังไม่ได้รับการ approve' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ error: 'บัญชีของคุณถูกปฏิเสธ' });
    }

    const passwordMatch = await bcrypt.compare(req.body.password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Wrong password' });
    }

    // เจน JWT token
    const token = jwt.sign(
      { 
        email: user.email,
        userId: user._id,
        username: user.username 
      }, 
      process.env.JWT_KEY,
      { 
        expiresIn: '24h'
      }
    );

    res.status(200).json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'ไม่ทราบสาเหตุ' });
  }
});


router.put('/users/:id/approved',

    async (req, res) => {
  try {
    const { id } = req.params; // ดึง User ID จาก URL
    const { status } = req.body; // ดึงค่า status request body

    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'format user ID ไม่ถูกต้อง' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'การ approval status. ควรจะมีแค่ "approved" หรือ "rejected".' });
    }

    //ค้นหาผู้ใช้ในฐานข้อมูลตาม :id
    const userToApprove = await userSchema.findById(id);

    if (!userToApprove) {
      return res.status(404).json({ error: 'ไม่เจอข้อมูล User' });
    }

    userToApprove.status = status;
    userToApprove.approvedAt = new Date(); // timestamp

    
    await userToApprove.save();

    //respond กลับ
    
    res.status(200).json({
      message: `User ${status} สำเร็จ`,});


  } catch (error) {
    console.error("Error ในการ approve user:", error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


module.exports = router;