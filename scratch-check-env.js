const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    console.log("Keys found in .env:", Object.keys(envConfig));
  } else {
    console.log(".env file not found at", envPath);
  }
} catch (error) {
  console.error("Error reading .env:", error.message);
}
