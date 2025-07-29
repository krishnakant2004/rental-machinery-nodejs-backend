const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { email, password, phone, name, roles } = req.body;

        // Validate required fields
        if (!email || !password || !phone || !name) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({success:false, message: 'Email already registered' });
        }

        // Validate required fields
        if (!email || !password || !phone || !name) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate phone number format
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ success:false,message: 'Invalid phone number format' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success:false,message: 'Invalid email format' });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({success:false, message: 'Password must be at least 6 characters long' });
        }

        // Set default role if not provided
        const userRoles = roles || ['farmer'];

        // Create new user
        const user = new User({
            email,
            password,
            phone,
            name,
            roles: userRoles,
            isVerified: false,
            verificationStatus: 'pending'
        });

        await user.save();

        // Generate token
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Remove password from response
        const userObject = user.toObject();
        delete userObject.password;

        res.status(201).json({ user: userObject, token });
    } catch (error) {
        console.log(error.message);
        res.status(400).json({ success:false,message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body);

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({success:false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ success:false,message: 'Invalid login credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success:false,message: 'Invalid login credentials' });
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // Remove password from response
        const userObject = user.toObject();
        delete userObject.password;

        res.json({ success:true,message:"user login successfully",data: userObject,token: token });
    } catch (error) {
        res.status(400).json({success:false, message: error.message });
    }
};


exports.getProfile = async (req, res) => {
    try {
        // Remove password from response
        const userObject = req.user.toObject();
        delete userObject.password;
        
        res.json(userObject);
    } catch (error) {
        res.status(400).json({ success:false, message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = [
            'name', 'phone', 'address', 
            'shopDetails', 'providerDetails', 
            'farmerDetails', 'operatorDetails',
            'labourDetails'
        ];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ success:false, message: 'Invalid updates' });
        }

        // Validate phone number if being updated
        if (req.body.phone) {
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(req.body.phone)) {
                return res.status(400).json({success:false,  message: 'Invalid phone number format' });
            }
        }

        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();

        // Remove password from response
        const userObject = req.user.toObject();
        delete userObject.password;

        res.json({success:true,message:"profile updated successfully", data:userObject});
    } catch (error) {
        res.status(400).json({ success:false, message: error.message });
    }
};

exports.addRole = async (req, res) => {
    try {
        const { role, roleDetails } = req.body;
        
        // Validate role
        const validRoles = ['farmer', 'provider', 'shopkeeper', 'operator', 'admin', 'labour'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({success:false, message: 'Invalid role' });
        }

        // Add the role
        await req.user.addRole(role);

        // Add role-specific details
        if (roleDetails) {
            switch (role) {
                case 'shopkeeper':
                    req.user.shopDetails = roleDetails;
                    break;
                case 'provider':
                    req.user.providerDetails = roleDetails;
                    break;
                case 'farmer':
                    req.user.farmerDetails = roleDetails;
                    break;
                case 'operator':
                    req.user.operatorDetails = roleDetails;
                    break;
                case 'labour':
                    req.user.labourDetails = roleDetails;
                    break;
            }
            await req.user.save();
        }

        // Remove password from response
        const userObject = req.user.toObject();
        delete userObject.password;

        res.json({success:true,message:"role added successfully",data:userObject});
    } catch (error) {
        res.status(400).json({success:false, message: error.message });
    }
};

exports.removeRole = async (req, res) => {
    try {
        const { role } = req.body;
        
        // Prevent removing all roles
        if (req.user.roles.length <= 1) {
            return res.status(400).json({success:false, message: 'Cannot remove the only role' });
        }

        // Validate role
        const validRoles = ['farmer', 'provider', 'shopkeeper', 'operator', 'admin', 'labour'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success:false,message: 'Invalid role' });
        }

        await req.user.removeRole(role);

        // Remove password from response
        const userObject = req.user.toObject();
        delete userObject.password;

        res.json({success:true,message:"role removed successfully",data:userObject});
    } catch (error) {
        res.status(400).json({success:false, message: error.message });
    }
};

exports.updateLabourAvailability = async (req, res) => {
    try {
        if (!req.user.hasRole('labour')) {
            return res.status(403).json({success:false,  message: 'User is not a labour' });
        }

        const { availability, seasonalAvailability } = req.body;

        if (typeof availability === 'boolean') {
            req.user.labourDetails.availability = availability;
        }

        if (seasonalAvailability && Array.isArray(seasonalAvailability)) {
            req.user.labourDetails.seasonalAvailability = seasonalAvailability;
        }

        await req.user.save();

        // Remove password from response
        const userObject = req.user.toObject();
        delete userObject.password;

        res.json({success:true,message:"update labour availability successfully ",data:userObject});
    } catch (error) {
        res.status(400).json({success:false,  message: error.message });
    }
};

exports.logout = async (req, res) => {
    try {
        // In a more complex implementation, you might want to blacklist the token
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success:false,message: error.message });
    }
};

exports.checkAuth = async (req, res) => {
    try {
        // Remove password from response
        const userObject = req.user.toObject();
        delete userObject.password;
        
        res.json({ 
            isAuthenticated: true,
            user: userObject
        });
    } catch (error) {
        res.status(401).json({ 
            isAuthenticated: false,
            message: error.message 
        });
    }
};

exports.updatePassword = async (req,res) => {
    try{
        const {newPass} = req.body;
        const user = await User.findById(req.params.id);

        if(!user){
            res.json({success:false,message:"user not found!"});
        }

        user.password = newPass;
        user.save();


        res.json({success:true,message:"user password updated successfully",data:user});
    }catch(err){
        res.status(501).json({success:false,message:err.message});
    }

}
