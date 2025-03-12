const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    roles: [{
        type: String,
        enum: ['farmer', 'provider', 'shopkeeper', 'operator', 'admin', 'labour'],
        required: true
    }],
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: undefined
        }
    },
    documents: {
        idProof: String,
        addressProof: String,
        businessLicense: String,  // For shopkeepers and providers
        gstin: String,           // For shopkeepers and providers
    },
    shopDetails: {              // For shopkeepers
        shopName: String,
        shopType: String,
        registrationNumber: String,
        openingHours: {
            open: String,
            close: String
        }
    },
    providerDetails: {         // For machinery providers
        businessName: String,
        experience: Number,
        serviceArea: [{
            city: String,
            state: String
        }]
    },
    farmerDetails: {          // For farmers
        farmSize: Number,      // in acres
        primaryCrops: [String],
        farmingType: [String]  // e.g., ['organic', 'traditional']
    },
    operatorDetails: {        // For machinery operators
        experience: Number,
        specializations: [String],
        licenses: [String],
        availability: {
            type: Boolean,
            default: true
        }
    },
    labourDetails: {         // For agricultural labourers
        skills: [String],    // e.g., ['harvesting', 'planting', 'pruning']
        experience: Number,  // in years
        dailyWage: Number,
        availability: {
            type: Boolean,
            default: true
        },
        preferredWorkTypes: [String], // e.g., ['seasonal', 'daily']
        languages: [String],  // Languages spoken
        physicalCapabilities: {
            canLiftHeavyWeights: Boolean,
            canWorkInSunlight: Boolean,
            canOperateBasicTools: Boolean
        },
        workHistory: [{
            farmName: String,
            duration: String,
            workType: String,
            location: String
        }],
        preferredLocations: [{
            city: String,
            state: String
        }],
        seasonalAvailability: [{
            season: String,    // e.g., 'summer', 'monsoon', 'winter'
            isAvailable: Boolean
        }]
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

// Method to check if user has a specific role
userSchema.methods.hasRole = function(role) {
    return this.roles.includes(role);
};

// Method to add a new role
userSchema.methods.addRole = async function(role) {
    if (!this.roles.includes(role)) {
        this.roles.push(role);
        await this.save();
    }
};

// Method to remove a role
userSchema.methods.removeRole = async function(role) {
    if (this.roles.includes(role)) {
        this.roles = this.roles.filter(r => r !== role);
        await this.save();
    }
};

const User = mongoose.model('User', userSchema);
module.exports = User;
