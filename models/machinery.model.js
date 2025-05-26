const mongoose = require('mongoose');

const machinerySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Tractor', 'Harvester', 'Cultivator', 'Thresher', 'Sprayer', 'WaterPump']
    },
    description: {
        type: String,
        required: true
    },
    hourlyRate: {
        type: Number,
        required: true
    },
    dailyRate: {
        type: Number,
        required: true
    },
    images:  [{
        image: {
            type: Number,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    address :{
        type : String,
        require : false,
    },
    specifications: {
        type: Map,
        of: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        address: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    operatorAvailable: {
        type: Boolean,
        default: false
    },
    operatorCharges: {
        type: Number,
        default: 0
    },
    availability: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for location-based queries
machinerySchema.index({ location: '2dsphere' });

const Machinery = mongoose.model('Machinery', machinerySchema);
module.exports = Machinery;
