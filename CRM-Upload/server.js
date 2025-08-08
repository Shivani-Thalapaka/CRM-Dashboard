const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customerRoutes');
const leadRoutes = require('./routes/leadRoutes');
const stageRoutes = require('./routes/stageRoutes');
const contactRoutes = require('./routes/contactRoutes');
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/contacts', contactRoutes);

// Serve frontend for root route
app.get('/', (req, res) => {
 res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
 console.log(`Server is running on port ${PORT}`);
 console.log(`Frontend available at: http://localhost:${PORT}`);
 console.log(`Mobile access: http://172.20.10.4:${PORT}`);
 console.log('Server accepting connections from all network interfaces');
});