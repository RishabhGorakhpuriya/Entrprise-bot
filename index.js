const express = require('express'); // Correct module
const app = express(); // Initialize express app
const data = require('./routes/router');
const port = 4000;

app.get('/', data);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
