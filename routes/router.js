// router/routes.js
const express = require('express');
const router = express.Router();
const getData = require('../controller/getData');

// Define a route for the root path
router.get('/', async (req, res) => {
    try {
        // Call the getData function to get data
        const data = await getData(); // Assuming getData is an async function
        res.json(data); // Send the data as JSON
    } catch (error) {
        res.status(500).send('Error retrieving data');
    }
});

// Export the router
module.exports = router;
