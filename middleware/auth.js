const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
    try {
        console.log(req.body);
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({ success:false,message: 'Unauthorized: No authorization header' });
        }
        

        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({success:false,message: 'No token provided'});
            
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded._id });
        // console.log(user);

        if (!user) {
            return res.status(401).json({success:false,message: 'User not found'});
        }

        // Check token expiration
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTimestamp) {
            return res.status(401).json({success:false,message:'Token expired'});
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        let message = 'Please authenticate';
        
        if (error.message === 'Token expired') {
            message = 'Session expired. Please login again.';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Invalid token. Please login again.';
        }
        
        res.status(401).json({ success:false,message:message });
    }
};

module.exports = auth;
