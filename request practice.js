const express = require('express');
const app = express();

// Middleware to parse different types of data
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.raw()); // Parse raw bodies
app.use(express.text()); // Parse text bodies

// ===== 1. GET REQUEST =====
// Used for: Retrieving data, no body content
app.get('/users', (req, res) => {
    // Data passed via:
    console.log('Query Parameters:', req.query); // ?name=john&age=25
    console.log('Route Parameters:', req.params); // /users/:id
    console.log('Headers:', req.headers);
    
    res.json({ message: 'GET request received', data: req.query });
});

// GET with route parameters
app.get('/users/:id', (req, res) => {
    const userId = req.params.id; // Extract :id from URL
    console.log('User ID:', userId);
    res.json({ userId, user: 'User data here' });
});

// ===== 2. POST REQUEST =====
// Used for: Creating new resources, sending data
app.post('/users', (req, res) => {
    // Data passed via:
    console.log('Request Body:', req.body); // JSON/form data in body
    console.log('Query Parameters:', req.query); // Still available
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.get('Content-Type'));
    
    // Example creating user
    const newUser = {
        id: Date.now(),
        name: req.body.name,
        email: req.body.email
    };
    
    res.status(201).json({ message: 'User created', user: newUser });
});

// ===== 3. PUT REQUEST =====
// Used for: Updating entire resource (complete replacement)
app.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const updatedUser = req.body;
    
    console.log('Updating user:', userId);
    console.log('New data:', updatedUser);
    
    res.json({ message: 'User updated completely', userId, data: updatedUser });
});

// ===== 4. PATCH REQUEST =====
// Used for: Partial updates to existing resource
app.patch('/users/:id', (req, res) => {
    const userId = req.params.id;
    const partialUpdate = req.body;
    
    console.log('Partially updating user:', userId);
    console.log('Fields to update:', partialUpdate);
    
    res.json({ message: 'User partially updated', userId, updates: partialUpdate });
});

// ===== 5. DELETE REQUEST =====
// Used for: Removing resources
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    
    console.log('Deleting user:', userId);
    console.log('Query params:', req.query); // Additional parameters
    
    res.json({ message: 'User deleted', userId });
});

// ===== 6. HEAD REQUEST =====
// Used for: Getting headers only (no body)
app.head('/users/:id', (req, res) => {
    const userId = req.params.id;
    // Check if resource exists
    res.set('Resource-Exists', 'true');
    res.status(200).end(); // No body sent
});

// ===== 7. OPTIONS REQUEST =====
// Used for: CORS preflight, checking allowed methods
app.options('/users', (req, res) => {
    res.set({
        'Allow': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    res.status(200).end();
});

// ===== COMPREHENSIVE REQUEST OBJECT FIELDS =====
app.all('/debug', (req, res) => {
    const requestInfo = {
        // Basic Info
        method: req.method,
        url: req.url,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl,
        path: req.path,
        
        // Parameters
        params: req.params,      // Route parameters (:id)
        query: req.query,        // Query string (?key=value)
        body: req.body,          // Request body (POST/PUT data)
        
        // Headers
        headers: req.headers,
        cookies: req.cookies,    // Parsed cookies
        
        // Content Info
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        userAgent: req.get('User-Agent'),
        authorization: req.get('Authorization'),
        
        // Network Info
        ip: req.ip,
        ips: req.ips,
        hostname: req.hostname,
        protocol: req.protocol,
        secure: req.secure,
        
        // Express specific
        route: req.route,
        app: req.app ? 'Express App Instance' : null,
        
        // File uploads (with multer middleware)
        files: req.files || 'No files uploaded',
        
        // Custom properties (set by middleware)
        user: req.user || 'No user authenticated',
        
        // Raw data
        rawHeaders: req.rawHeaders,
        httpVersion: req.httpVersion
    };
    
    res.json(requestInfo);
});

// ===== DIFFERENT WAYS TO PASS DATA =====

// 1. Query Parameters Example: /search?q=nodejs&limit=10
app.get('/search', (req, res) => {
    const { q, limit, page } = req.query;
    res.json({ 
        searchTerm: q, 
        limit: parseInt(limit) || 10,
        page: parseInt(page) || 1 
    });
});

// 2. Route Parameters Example: /posts/123/comments/456
app.get('/posts/:postId/comments/:commentId', (req, res) => {
    const { postId, commentId } = req.params;
    res.json({ postId, commentId });
});

// 3. Request Body (JSON)
app.post('/api/data', (req, res) => {
    const { name, age, email, preferences } = req.body;
    res.json({ 
        received: { name, age, email, preferences },
        timestamp: new Date().toISOString()
    });
});

// 4. Headers
app.get('/protected', (req, res) => {
    const authToken = req.get('Authorization');
    const apiKey = req.get('X-API-Key');
    const customHeader = req.get('X-Custom-Header');
    
    if (!authToken) {
        return res.status(401).json({ error: 'Authorization header required' });
    }
    
    res.json({ authToken, apiKey, customHeader });
});

// 5. Form Data (URL-encoded)
app.post('/form-submit', (req, res) => {
    // Content-Type: application/x-www-form-urlencoded
    const formData = req.body;
    res.json({ message: 'Form submitted', data: formData });
});

// 6. File Uploads (requires multer middleware)
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
    const fileInfo = {
        originalName: req.file?.originalname,
        filename: req.file?.filename,
        size: req.file?.size,
        mimetype: req.file?.mimetype,
        additionalData: req.body // Other form fields
    };
    
    res.json({ message: 'File uploaded', file: fileInfo });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log('GET    /users');
    console.log('GET    /users/:id');
    console.log('POST   /users');
    console.log('PUT    /users/:id');
    console.log('PATCH  /users/:id');
    console.log('DELETE /users/:id');
    console.log('GET    /debug - Shows all request fields');
});

/*
=== TESTING EXAMPLES ===

1. GET with query parameters:
GET /users?name=john&age=25&city=delhi

2. POST with JSON body:
POST /users
Content-Type: application/json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}

3. PUT with route parameter and body:
PUT /users/123
Content-Type: application/json
{
  "name": "John Updated",
  "email": "john.new@example.com"
}

4. DELETE with route parameter:
DELETE /users/123?reason=inactive

5. Custom headers:
GET /protected
Authorization: Bearer token123
X-API-Key: abc123
*/