const axios = require('axios');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
// Your API Key from data.gov.in ---
const API_KEY = '579b464db66ec23bdd0000012540baf4249744fe6c91c358969b5a53';
// This is the correct API Resource ID ---
const RESOURCE_ID = 'ee03643a-ee4c-48c2-ac30-9f2ff26ab722';
const API_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=3000`;


const performanceSchema = new mongoose.Schema({
    state_name: String,
    district_name: String,
    financial_year: String,
    total_jobcards_issued: Number,
    total_workers: Number,
    total_households_provided_employment: Number,
});

const Performance = mongoose.model('Performance', performanceSchema);

// 5. The main sync function
async function syncData() {
    if (MONGO_URI.includes('YOUR_NEW_PASSWORD')) {
        console.error('ERROR: Please update YOUR_NEW_PASSWORD in the MONGO_URI variable.');
        return;
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected...');

        console.log('Fetching data from NEW API (ee03643a...)...');
        const response = await axios.get(API_URL);

        if (!response.data || !response.data.records) {
            console.error('Error: "records" field not found in API response.');
            return;
        }

        const records = response.data.records;
        console.log(`Found ${records.length} total records in API response.`);

        console.log('Preparing to save all records to database...');

        // 6. Save ALL records to your database
        const operations = records.map(record => ({
            updateOne: {
                filter: {
                    district_name: record.district_name,
                    financial_year: record.FinYear 
                },
                update: {
                    $set: {
                        state_name: record.state_name,
                        district_name: record.district_name,
                        financial_year: record.FinYear,
                        total_jobcards_issued: Number(record.Total_No_of_JobCards_issued) || 0,
                        total_workers: Number(record.Total_No_of_Workers) || 0,
                        total_households_provided_employment: Number(record.Total_No_of_HH_provided_employment) || 0,
                    }
                },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await Performance.bulkWrite(operations);
            console.log('✅ Data sync complete! All states are now in the database.');
        }

    } catch (error) {
        console.error('Error syncing data:', error.message);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('MongoDB disconnected.');
        }
    }
}

syncData();