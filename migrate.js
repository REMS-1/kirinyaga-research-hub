require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const MONGO_URI = process.env.MONGO_URI;

// Import Schema-less models for migration
const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
const Problem = mongoose.model("Problem", new mongoose.Schema({}, { strict: false }));
const Solution = mongoose.model("Solution", new mongoose.Schema({}, { strict: false }));
const Discussion = mongoose.model("Discussion", new mongoose.Schema({}, { strict: false }));
const Notification = mongoose.model("Notification", new mongoose.Schema({}, { strict: false }));
const Opportunity = mongoose.model("Opportunity", new mongoose.Schema({}, { strict: false }));

const DB_PATH = path.join(__dirname, "db.json");

async function migrate() {
    try {
        console.log("🚀 Starting Data Migration to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB Atlas.");

        if (!fs.existsSync(DB_PATH)) {
            console.log("❌ db.json not found. Nothing to migrate.");
            process.exit(0);
        }

        const db = JSON.parse(fs.readFileSync(DB_PATH));
        console.log("📁 Found Database keys:", Object.keys(db));
        if (db.users) console.log(`   - Users: ${db.users.length}`);
        if (db.problems) console.log(`   - Problems: ${db.problems.length}`);
        if (db.solutions) console.log(`   - Solutions: ${db.solutions.length}`);
        if (db.discussions) console.log(`   - Discussions: ${db.discussions.length}`);

        // Migrate Users
        if (db.users && db.users.length > 0) {
            console.log(`👤 Migrating ${db.users.length} users...`);
            await User.insertMany(db.users);
        }

        // Migrate Problems
        if (db.problems && db.problems.length > 0) {
            console.log(`📋 Migrating ${db.problems.length} problems...`);
            // Ensure approved field exists
            const problems = db.problems.map(p => ({ ...p, approved: true }));
            await Problem.insertMany(problems);
        }

        // Migrate Solutions
        if (db.solutions && db.solutions.length > 0) {
            console.log(`💡 Migrating ${db.solutions.length} solutions...`);
            // Ensure isApproved field exists
            const solutions = db.solutions.map(s => ({ ...s, isApproved: true }));
            await Solution.insertMany(solutions);
        }

        // Migrate Discussions
        if (db.discussions && db.discussions.length > 0) {
            console.log(`💬 Migrating ${db.discussions.length} messages...`);
            await Discussion.insertMany(db.discussions);
        }

        // Migrate Opportunities
        if (db.opportunities && db.opportunities.length > 0) {
            console.log(`🎓 Migrating ${db.opportunities.length} opportunities...`);
            await Opportunity.insertMany(db.opportunities);
        }

        console.log("🎉 Migration Complete! Kirinyaga Hub is now Cloud-Powered.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Migration Failed:", err);
        process.exit(1);
    }
}

migrate();
