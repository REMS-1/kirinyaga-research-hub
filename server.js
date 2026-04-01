require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = "researchhub_secret_key_2026";

// ===== DATABASE CONNECTION =====
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected: Cloud Database Active"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ===== MODELS =====
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "Researcher" },
  institution: String,
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", UserSchema);

const ProblemSchema = new mongoose.Schema({
  title: String,
  category: String,
  location: String,
  description: String,
  owner: String,
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Problem = mongoose.model("Problem", ProblemSchema);

const SolutionSchema = new mongoose.Schema({
  title: String,
  linkedProblem: String,
  tags: [String],
  desc: String,
  author: String,
  authorEmail: String,
  shape: String,
  file: String,
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Solution = mongoose.model("Solution", SolutionSchema);

const DiscussionSchema = new mongoose.Schema({
  topic: String,
  user: String,
  role: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});
const Discussion = mongoose.model("Discussion", DiscussionSchema);

const NotificationSchema = new mongoose.Schema({
  userEmail: String,
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});
const Notification = mongoose.model("Notification", NotificationSchema);

// ===== AUTH =====
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role, institution } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role, institution });
    await user.save();
    res.json({ message: "Registration successful." });
  } catch (err) {
    res.status(500).json({ error: "Registration failed. Email might already exist." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.json({ token, name: user.name, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== PROBLEMS =====
app.get("/api/problems", async (req, res) => {
  try {
    // Return all problems for now, but in future filter by approved: true
    const problems = await Problem.find({}); 
    res.json(problems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/problems", async (req, res) => {
  try {
    const problem = new Problem({ ...req.body, approved: false }); // Now awaiting admin vetting
    await problem.save();
    res.json({ message: "Problem logged. Awaiting admin approval.", problem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SOLUTIONS =====
app.get("/api/solutions", async (req, res) => {
  try {
    const { linkedProblem } = req.query;
    let query = { isApproved: true }; 
    // If Admin or the author, we might want to show pending too, but for simplicity:
    const solutions = await Solution.find(linkedProblem ? { 
        linkedProblem: { $regex: linkedProblem, $options: "i" },
        isApproved: true 
    } : { isApproved: true });

    // Join with discussion counts
    const results = await Promise.all(solutions.map(async (sol) => {
        const count = await Discussion.countDocuments({ topic: sol.title });
        return { ...sol.toObject(), feedbackCount: count };
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/solutions", async (req, res) => {
  try {
    // New solutions are isApproved: true for now to maintain current functionality
    // but the schema allows isApproved: false for future admin vetting
    const solution = new Solution({ ...req.body, isApproved: true }); 
    await solution.save();

    // Log a notification for the author
    const user = await User.findOne({ name: req.body.author });
    if (user) {
        const notif = new Notification({
            userEmail: user.email,
            title: "Research Published",
            message: `Your solution "${solution.title}" is now live on the Kirinyaga Hub.`
        });
        await notif.save();
    }

    res.json({ message: "Solution saved.", solution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/solutions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Solution.findByIdAndDelete(id);
    res.json({ message: "Solution deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== DISCUSSIONS =====
app.get("/api/discussions", async (req, res) => {
  try {
    const { topic } = req.query;
    const chats = await Discussion.find(topic ? { topic } : {});
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/discussions", async (req, res) => {
  try {
    const msg = new Discussion(req.body);
    await msg.save();
    res.json({ message: "Message sent.", msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== COMMUNICATIONS =====
app.get("/api/communications", async (req, res) => {
  try {
    const { userEmail } = req.query;
    if (!userEmail) return res.status(400).json({ error: "Email required." });
    const logs = await Notification.find({ userEmail }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== STATS =====
app.get("/api/stats", async (req, res) => {
  try {
    const problems = await Problem.countDocuments({});
    const solutions = await Solution.countDocuments({});
    const users = await User.countDocuments({});
    // Simulated subscribers count for UI parity
    res.json({ problems, solutions, users, subscribers: 124 }); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== MY RESEARCH =====
app.get("/api/my-research", async (req, res) => {
  try {
    const { userName } = req.query;
    if (!userName) return res.status(400).json({ error: "User name required." });
    
    // Find all problems and solutions authored by this user
    const myProblems = await Problem.find({ owner: userName }).sort({ createdAt: -1 });
    const mySolutions = await Solution.find({ author: userName }).sort({ createdAt: -1 });
    
    res.json({ problems: myProblems, solutions: mySolutions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ADMIN MANAGEMENT =====
app.get("/api/admin/all", async (req, res) => {
  try {
    const problems = await Problem.find({}).sort({ createdAt: -1 });
    const solutions = await Solution.find({}).sort({ createdAt: -1 });
    res.json({ problems, solutions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/approve/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    if (type === "problem") {
      await Problem.findByIdAndUpdate(id, { approved: true });
    } else if (type === "solution") {
      await Solution.findByIdAndUpdate(id, { isApproved: true });
    } else {
      return res.status(400).json({ error: "Invalid type." });
    }
    res.json({ message: `${type} approved successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/problems/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Problem.findByIdAndDelete(id);
    res.json({ message: "Problem removed." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== OPPORTUNITIES =====
const OpSchema = new mongoose.Schema({
    title: String,
    category: String,
    deadline: String,
    description: String,
    createdAt: { type: Date, default: Date.now }
});
const Opportunity = mongoose.model("Opportunity", OpSchema);

app.get("/api/opportunities", async (req, res) => {
    try {
        const ops = await Opportunity.find({});
        res.json(ops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Kirinyaga Hub Professional Core Live at http://localhost:${PORT}`);
});