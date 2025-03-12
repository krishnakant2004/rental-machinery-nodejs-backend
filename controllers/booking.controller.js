const Booking = require('../models/booking.model');
const Machinery = require('../models/machinery.model');

exports.createBooking = async (req, res) => {
    try {
        console.log(req.body);
        const machinery = await Machinery.findById(req.body.machinery);
        if (!machinery) {
            return res.status(404).json({ success: false, message: "Machinery not found" });
        }

        if (!machinery.availability) {
            return res.status(400).json({success:false, message: "Machinery is not available" });
        }

        // Calculate total amount based on duration and rates
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);
        const hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
        const days = Math.ceil(hours / 24);

        let totalAmount = days * machinery.dailyRate;
        if (req.body.withOperator && machinery.operatorAvailable) {
            totalAmount += days * machinery.operatorCharges;
        }
        if(req.body.withOperator){
            req.body.operator = machinery.owner;
        }

        const booking = new Booking({
            ...req.body,
            renter: req.user._id,
            totalAmount
        });

        await booking.save();
        machinery.availability = false;
        await machinery.save();

        res.status(201).json({success:true,message:"booking created successfully",data:booking});
    } catch (error) {
        console.log(error.message);
        res.status(401).json({success:true, message: error.message });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id)
            .populate('machinery');

        if (!booking) {
            return res.status(404).json({ success:false,message: "Booking not found" });
        }

        // Check if user is the machinery owner
        if (booking.machinery.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success:false, message: "Not authorized" });
        }

        booking.status = status;
        await booking.save();

        // Update machinery availability if booking is accepted
        if (status === 'accepted') {
            const machinery = await Machinery.findById(booking.machinery);
            machinery.availability = false;
            await machinery.save();
        }

        res.json({ success:true,message:"update successful",data:booking});
    } catch (error) {
        res.status(400).json({  success:false,message: error.message });
    }
};

exports.getBookings = async (req, res) => {
    try {
        // Fetch only bookings where the logged-in user is the renter
        const query = { renter: req.user._id };

        const bookings = await Booking.find(query)
            .populate({
                path: 'machinery',
                populate: { path: 'owner', select: 'name email phone' } // Include machinery owner details
            })
            .populate('renter', 'name email phone') // Include renter details
            .populate('operator', 'name phone') // Include operator details
            .sort({ createdAt: -1 });

        res.json({ success: true, message: "Bookings retrieved successfully", data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('machinery')
            .populate('renter', 'name email phone')
            .populate('operator', 'name phone');

        if (!booking) {
            return res.status(404).json({  success:false,message: 'Booking not found' });
        }

        // Check if user is authorized to view this booking
        if (req.user.role === 'farmer' && booking.renter.toString() !== req.user._id.toString()) {
            return res.status(403).json({  success:false,message: 'Not authorized' });
        }

        res.json({ success:true,message:"booking retrieved successful",data:booking});
    } catch (error) {
        res.status(500).json({  success:false,message: error.message });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        console.log("hello")
        const booking = await Booking.findById(req.params.id).populate('machinery');
        if (!booking) {
            return res.status(404).json({  success:false,message: "Booking not found." });
        }

        const diffInHours = (Date.now() - new Date(booking.createdAt).getTime()) / (1000 * 60 * 60);
        console.log(diffInHours);
        if (diffInHours > 100) {
            return res.status(402).json({ success:false, message: "Time exceeded 1 hour from booking, so cannot cancel order." });
        }

        if (booking.machinery) {
            booking.machinery.availability = true;
            await booking.machinery.save();
        }

        await booking.deleteOne(); 
        res.status(200).json({  success:true,message: "Booking cancelled successfully." });

    } catch (error) {
        // console.error(error);
        res.status(500).json({  success:false,message: error.message.toString() });
    }
};


