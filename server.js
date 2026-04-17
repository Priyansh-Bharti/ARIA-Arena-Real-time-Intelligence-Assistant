const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;

// Serve all static files from the current directory
app.use(express.static(__dirname));

// Fallback to index.html for PWA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ARIA serving on port ${PORT}`);
});
