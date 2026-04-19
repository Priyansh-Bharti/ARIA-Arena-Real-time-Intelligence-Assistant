const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;

// Serve all static files from the current directory
app.use(express.static(__dirname));

// Google Cloud Services: BigQuery Analytics Bridge (Mock)
// Simulates streaming live venue telemetry to GCP BigQuery for crowd density forecasting.
const streamToBigQuery = (event) => {
  console.log(`[BigQuery] Dataset ARIA_Live_Pulse: ${event} recorded at ${new Date().toISOString()}`);
};

// Fallback to index.html for PWA routing
app.get('*', (req, res) => {
  if (req.url === '/') streamToBigQuery('USER_SESSION_START');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[ARIA] Production server active on port ${PORT}`);
});
