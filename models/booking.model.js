const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    machinery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Machinery',
        required: true
    },
    renter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    withOperator: {
        type: Boolean,
        required: true
    },
    operator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  
        validate: {
            validator: async function(value) {
                if (!value) return true; 
                const User = mongoose.model('User');
                const user = await User.findById(value);
                return user && user.roles.includes('operator');
            },
            message: 'Selected user must have the operator role'
        }
    },
    totalAmount: {
        type: Number,
        required: true
    },
    location: {
        address: String,
        coordinates: {
            type: [Number],
            required: true
        }
    },
    notes: String,
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
