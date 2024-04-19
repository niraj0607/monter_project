const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Route to get user information
router.get('/user-info', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).send('User not found.'); 
        }
        res.json(user); 
    } catch (error) {
        console.log(error); 
        if (!res.headersSent) { 
            res.status(500).json({ message: 'Error retrieving user data', error });
        }
    }
});



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
        const otp = Math.floor(100000 + Math.random() * 900000);

        const newUser = new User(
            { 
                email, 
                password: hashedPassword,
                otp
            });
        await newUser.save();
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

        try {
            const token = jwt.sign(
                { _id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            
            res.header('auth-token', token).send({ token });
        } catch (err) {
            console.error('Error generating JWT:', err);
            res.status(500).send('Internal Server Error');
        }
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ message: 'Error logging in', err });
    }
});


// Verify and Update User
router.post('/verify', async (req, res) => {
    const { email, otp, location, age, work } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).send('User not found.');
        if (user.otp === otp) {
            user.isVerified = true;
            user.otp = null;  // Clear OTP
            user.profile = { location, age, work };
            await user.save();
            return res.json({ message: 'Account verified and profile updated successfully.', user: user });
        } else {
            return res.status(400).send('Invalid OTP.');
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
