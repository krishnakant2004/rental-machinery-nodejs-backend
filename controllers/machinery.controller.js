const Machinery = require('../models/machinery.model');
const {uploadMachinery} = require('../uploadFile');
const multer = require('multer');

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
        
            // console.log(machinery);

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

exports.getMachineryByProviderId = async(req,res) => {
    try {
        const ownerId = req.params.providerId;
        
        const machinery = await Machinery.find({ owner: ownerId })
            .populate('owner', 'name email phone')
            .sort({ createdAt: -1 });

        if (!machinery || machinery.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No machinery found for this provider' 
            });
        }

        res.json({
            success: true,
            message: "Provider's machinery retrieved successfully",
            data: machinery
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}

exports.addMachinery = async(req, res) => {
    try{
        console.log("create file");
        // Execute the Multer middleware to handle multiple file fields
        uploadMachinery.fields([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
            { name: 'image3', maxCount: 1 },
        ])(req ,res, async function (err) {
            if (err instanceof multer.MulterError) {
                // Handle Multer errors, if any
                if (err.code === 'LIMIT_FILE_SIZE') {
                    err.message = 'File size is too large. Maximum filesize is 5MB per image.';
                }
                console.log(`Add machinery: ${err}`);
                return res.json({ success: false, message: err.message });
            } else if (err) {
                // Handle other errors, if any
                console.log(`Add machinery: ${err}`);
                return res.json({ success: false, message: err });
            }

            const { name, type, description, hourlyRate, dailyRate, specifications, location, operatorAvailable, operatorCharges, availability } = req.body;
            const owner = req.user._id;
            if(!name || !location){
                return res.status(400).json({ success: false, message: "Required fields are missing." });
            }

            // Initialize an array to store image URLs
            const imageUrls = [];

            // Iterate over the file fields
            const fields = ['image1', 'image2', 'image3'];
            fields.forEach((field, index) => {
                if (req.files[field] && req.files[field].length > 0) {
                    const file = req.files[field][0];
                    const imageUrl = `http://localhost:3000/image/machinery/${file.filename}`;
                    imageUrls.push({ image: index + 1, url: imageUrl });
                }
            });
            
            const locationData = typeof location === 'string' ? JSON.parse(location) : location;
            const formattedLocation = {
                type: 'Point',
                coordinates: locationData.coordinates,
                address: locationData.address || ''
            };
            // Create a new product object with data
            const newMachinery = new Machinery({
                name,
                type,
                description,
                hourlyRate: parseFloat(hourlyRate),
                dailyRate: parseFloat(dailyRate),
                specifications: typeof specifications === 'string' ? JSON.parse(specifications) : specifications,
                images: imageUrls,
                owner,
                location: formattedLocation,
                operatorAvailable: operatorAvailable === "true",
                operatorCharges: parseFloat(operatorCharges) || 0,
                availability: availability === "true",
            });

            // Save the new product to the database
            await newMachinery.save();
            // Send a success response back to the client
            res.json({ success: true, message: "machinery created successfully.", data: null });
        })
    }catch(error){
        // Handle any errors that occur during the process
        console.error("Error creating product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.updateMachinery = async (req, res) => {
    const machineId = req.params.id;
    try {
        // Execute the Multer middleware to handle file fields
        uploadMachinery.fields([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
            { name: 'image3', maxCount: 1 }
        ])(req, res, async function (err) {
            if (err) {
                console.log(`Update machinery: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            }

            const { name, type, description, hourlyRate, dailyRate, specifications, location, operatorAvailable, operatorCharges, availability } = req.body;

            // Find the product by ID
            const machineryToUpdate = await Machinery.findById(machineId);
            if (!machineryToUpdate) {
                return res.status(404).json({ success: false, message: "Product not found." });
            }

            // 2. Update user properties
            Object.assign(machineryToUpdate, req.body); // Merge new data into the user object

            // Update product properties if provided
            // productToUpdate.name = name || productToUpdate.name;
            // productToUpdate.description = description || productToUpdate.description;
            // productToUpdate.quantity = quantity || productToUpdate.quantity;
            // productToUpdate.price = price || productToUpdate.price;
            // productToUpdate.offerPrice = offerPrice || productToUpdate.offerPrice;
            // productToUpdate.proCategoryId = proCategoryId || productToUpdate.proCategoryId;
            // productToUpdate.proSubCategoryId = proSubCategoryId || productToUpdate.proSubCategoryId;
            // productToUpdate.proBrandId = proBrandId || productToUpdate.proBrandId;
            // productToUpdate.proVariantTypeId = proVariantTypeId || productToUpdate.proVariantTypeId;
            // productToUpdate.proVariantId = proVariantId || productToUpdate.proVariantId;

            // Iterate over the file fields to update images
            const fields = ['image1', 'image2', 'image3'];
            fields.forEach((field, index) => {
                if (req.files[field] && req.files[field].length > 0) {
                    const file = req.files[field][0];
                    const imageUrl = `http://localhost:3000/image/machinery/${file.filename}`;
                    // Update the specific image URL in the images array
                    let imageEntry = machineryToUpdate.images.find(img => img.image === (index + 1));
                    if (imageEntry) {
                        imageEntry.url = imageUrl;
                    } else {
                        // If the image entry does not exist, add it
                        machineryToUpdate.images.push({ image: index + 1, url: imageUrl });
                    }
                }
            });

            // Save the updated product
            await machineryToUpdate.save();
            res.json({ success: true, message: "machinery updated successfully." });
        });
    } catch (error) {
        console.error("Error machinery product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};



exports.deleteMachinery = async (req, res) => {
    try {
        console.log("hello delete machinery");
        const machinery = await Machinery.findById(req.params.id);
        
        if (!machinery) {
            console.log("Machinery not found");
            return res.status(404).json({ success: true,message: 'Machinery not found' });
        }

        // Check if user is the owner
        if (machinery.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: true,message: 'Not authorized' });
        }
        if(machinery.availability === false){
            return res.status(403).json({ success: true,message: 'Cannot delete machinery with active bookings' });
        }   
        // Delete the machinery
        await Machinery.deleteOne({ _id: req.params.id });
        res.json({success: true, message: 'Machinery deleted' });
    } catch (error) {
        res.status(500).json({ success: false,message: error.message });
    }
};
