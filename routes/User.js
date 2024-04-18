const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const router = express.Router();

// Helper to send OTP
async function sendOTP(email, otp) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: 'Verify Your Account',
        text: `Your OTP is ${otp}.`
    });
}

// Register User
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        const otp = Math.floor(100000 + Math.random() * 900000);
        await sendOTP(email, otp);

        res.status(201).send('User registered and OTP sent');
    } catch (err) {
        res.status(500).json(err);
    }
});

//Login User
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).send('User not found.');

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).send('Invalid password.');

        if (!user.isVerified) return res.status(401).send('Account not verified.');

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.header('auth-token', token).send({ token });
    } catch (err) {
        res.status(500).json(err);
    }
});

// Verify User
router.post('/verify', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).send('User not found.');

        if (user.otp === otp) {
            user.isVerified = true;
            user.otp = null; // Clear OTP after successful verification
            await user.save();
            res.send('Account verified successfully.');
        } else {
            res.status(400).send('Invalid OTP.');
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
