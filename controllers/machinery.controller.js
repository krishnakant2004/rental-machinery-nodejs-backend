const Machinery = require('../models/machinery.model');

exports.listMachinery = async (req, res) => {
    try {
        const { type, location, radius, available } = req.query;
        let query = {};

        // Filter by type if specified
        if (type) {
            query.type = type;
        }

        // Filter by availability
        if (available === 'true') {
            query.availability = true;
        }

        // Filter by location if coordinates and radius are provided
        if (location && radius) {
            const [lng, lat] = location.split(',').map(Number);
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: parseInt(radius) * 1000 // Convert km to meters
                }
            };
        }

        const machinery = await Machinery.find(query)
            .populate('owner', 'name email phone')
            .sort({ createdAt: -1 });
        
            console.log(machinery);

        res.json({ success: true, message: "machinery retrieved successfully.", data: machinery });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMachineryById = async (req, res) => {
    try {
        const machinery = await Machinery.findById(req.params.id)
            .populate('owner', 'name email phone');
        
        if (!machinery) {
            return res.status(404).json({ success:false,message: 'Machinery not found' });
        }
        
        res.json({success:true,message:"machinery retrieved successfully ",data:machinery});
    } catch (error) {
        res.status(500).json({ success:false,message: error.message });
    }
};

exports.createMachinery =  async (req, res) => {
    try {
      const { name, type, description, hourlyRate, dailyRate, specifications, owner, location, operatorAvailable, operatorCharges, availability } = req.body;

        
      const newMachinery = new Machinery({
        name,
        type,
        description,
        hourlyRate: parseFloat(hourlyRate),
        dailyRate: parseFloat(dailyRate),
        specifications: specifications,
        images: [],
        owner,
        location: location,
        operatorAvailable: operatorAvailable === "true",
        operatorCharges: parseFloat(operatorCharges) || 0,
        availability: availability === "true",
      });
  
      await newMachinery.save();
      res.status(201).json({ success:true,message: "Machinery added successfully", data: newMachinery });
    } catch (error) {
        console.log(error.message);
      res.status(500).json({ success:false,message: "Error adding machinery", error: error.message });
    }
  };

exports.updateMachinery = async (req, res) => {
    try {
        const machinery = await Machinery.findById(req.params.id);
        
        if (!machinery) {
            return res.status(404).json({success: true, message: 'Machinery not found' });
        }

        // Check if user is the owner
        if (machinery.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: true,message: 'Not authorized' });
        }

        Object.assign(machinery, req.body);
        await machinery.save();
        res.json({success: true,message:"machinery update successful ",data:machinery});
    } catch (error) {
        res.status(400).json({success: false, message: error.message });
    }
};

exports.deleteMachinery = async (req, res) => {
    try {
        const machinery = await Machinery.findById(req.params.id);
        
        if (!machinery) {
            return res.status(404).json({ success: true,message: 'Machinery not found' });
        }

        // Check if user is the owner
        if (machinery.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: true,message: 'Not authorized' });
        }

        await machinery.remove();
        res.json({success: true, message: 'Machinery deleted' });
    } catch (error) {
        res.status(500).json({ success: false,message: error.message });
    }
};
