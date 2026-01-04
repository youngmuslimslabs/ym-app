const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../docs/all-us-universities.csv');
const jsonPath = path.join(__dirname, '../src/data/us-universities.json');

const csv = fs.readFileSync(csvPath, 'utf-8');
const universities = csv.trim().split('\n').map(line => line.trim()).filter(Boolean);

fs.writeFileSync(jsonPath, JSON.stringify(universities, null, 2));
console.log('Created us-universities.json with', universities.length, 'entries');
