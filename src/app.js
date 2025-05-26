const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser')

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('../routes/auth.routes');
const machineryRoutes = require('../routes/machinery.routes');
const bookingRoutes = require('../routes/booking.routes');

const app = express();

// Middleware
app.use(cors());

// Configure body parser with error handling
app.use(bodyParser.json({extended:true},{ strict: false },{
    verify: (req, res, buf, encoding) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            res.status(400).json({ message: 'Invalid JSON format in request body' });
            throw Error('Invalid JSON');
        }
    }
}));
app.use(bodyParser.urlencoded({ extended: true }));


app.use('/image/machinery', express.static('public/machinery'));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/machinery', machineryRoutes);
app.use('/api/bookings', bookingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: 'Invalid JSON format in request body' });
    }
    
    res.status(500).json({ message: 'Something went wrong!' });
});



// Database connection
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT;

app.listen(PORT,'0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
