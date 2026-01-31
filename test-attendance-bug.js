
const { pool } = require('./backend/db');
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const attendanceRoutes = require('./backend/routes/attendanceRoutes');

// Mock Auth Middleware
const mockAuth = (req, res, next) => {
    req.user = { id: 'test-user-id', role: 'employee' };
    next();
};

const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
    req.user = { id: '123e4567-e89b-12d3-a456-426614174000', role: 'employee' }; // Mock user
    next();
});
app.use('/attendance', attendanceRoutes);

// Mock DB interactions
const mockQuery = jest.fn();
pool.query = mockQuery;

describe('Attendance Logic Flaws', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Should allow office clock-in WITHOUT location data (Bug Verification)', async () => {
        // Mock existing record check (not clocked in yet)
        mockQuery.mockResolvedValueOnce({ rows: [] }); 
        
        // Mock insert
        mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, status: 'present' }] });

        const res = await request(app)
            .post('/attendance/clock-in')
            .send({
                clock_in_type: 'office',
                // No latitude/longitude provided
            });

        // If status is 200, the bug exists. It should be 400 or require location.
        console.log('Response status:', res.status);
        console.log('Response body:', res.body);
    });
});
