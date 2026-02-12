import express from "express";
import mongoose from "mongoose";
import puppeteer from "puppeteer";
import { Technician } from "./model/technician_schema.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

const connectDb = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI,
    );
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

app.get("/", async (req, res) => {
  const searchQuery = req.query.search || "";
  const statusFilter = req.query.status || "";
  const technicians = await Technician.find({
    $or: [
      { name: { $regex: searchQuery, $options: "i" } },
      { technicianId: { $regex: searchQuery, $options: "i" } },
      {
        phone: { $regex: parseInt(searchQuery) || searchQuery, $options: "i" },
      },
    ],
    $and: [{ status: { $regex: statusFilter, $options: "i" } }],
  }).sort({ createdAt: -1 });

  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginated = technicians.slice(startIndex, endIndex);
  const totalPages = Math.ceil(technicians.length / limit);

  const totalCount = technicians.length;
  const activeCount = technicians.filter(t => t.status === 'active').length;
  const inactiveCount = technicians.filter(t => t.status === 'inactive').length;
  const busyCount = technicians.filter(t => t.status === 'busy').length;

  res.render("technicians", {
    totalCount,
    activeCount,
    inactiveCount,
    busyCount,
    technicians: paginated,
    currentPage: page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    search: req.query.search || "",
  });
});

app.get("/technicians/new", (req, res) => {
  res.render("new_technician", { errors: null, inputData: null });
});

app.post("/technicians/new", async (req, res) => {
  console.log("Received form data:", req.body);
  try {
    const newTech = new Technician({
      name: req.body.name,
      phone: req.body.phone,
      lat: req.body.lat,
      long: req.body.long,
      currentlocation: req.body.currentlocation,
      status: req.body.status,
      rating: req.body.rating,
      technicianId: req.body.technicianId,
    });
    await newTech.save();

    res.redirect("/"); // Success redirect
  } catch (err) {
    res.render("new_technician", {
      errors: [{ msg: "Server error. Try again." }],
      inputData: req.body,
    });
  }

  res.render("new_technician", { errors: errors.array(), inputData: req.body });
});

app.get("/technicians/:id/edit", async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.status(404).send("Technician not found");
    }
    res.render("technicians-edit", {
      errors: null,
      technician,
      inputData: null,
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.post("/technicians/:id/edit", async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.status(404).send("Technician not found");
    }
    technician.name = req.body.name;
    technician.phone = req.body.phone;
    technician.lat = req.body.lat;
    technician.long = req.body.long;
    technician.currentlocation = req.body.currentlocation;
    technician.status = req.body.status;
    technician.rating = req.body.rating;
    technician.technicianId = req.body.technicianId;
    await technician.save();
    res.redirect("/");
  } catch (err) {
    res.render("technicians-edit", {
      errors: [{ msg: "Server error. Try again." }],
      technician: { ...req.body, _id: req.params.id },
      inputData: null,
    });
  }
});


app.get('/technicians/:id', async (req, res) => {
  try {
    // Fetch from DB (mock)
    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.status(404).render('404', { message: 'Technician not found' });
    }
    
    // Mock recent sessions
    const recentSessions = [
      { id: 1, date: '2026-02-10 14:30', customer: 'Amit R', issue: 'WhatsApp QR stuck', status: 'completed', duration: '45min' },
      { id: 2, date: '2026-02-10 11:15', customer: 'Priya S', issue: 'Multi-session setup', status: 'active', duration: '1h 20m' },
      { id: 3, date: '2026-02-09 18:45', customer: 'Ravi K', issue: 'Location spoofing', status: 'completed', duration: '30min' }
    ];
    
    res.render('technician-profile', { 
      technician, 
      recentSessions,
      avgResponseTime: '18min',
      totalCustomers: 247,
      successRate: 98.7 
    });
  } catch (err) {
    res.status(500).render('error', { message: 'Server error' });
  }
});


app.post("/mservice/", async (req, res) => {
  const id = req.body.id;
  const browser = await puppeteer.launch({
    userDataDir: `/sessions/${id}`,
    headless: false,
  });
  // Open a new page
  const page = await browser.newPage();
  await page.goto("https://newmservice.tataplay.com/");
  //await browser.close();
});

app.listen(7991, async () => {
  await connectDb();
  console.log("Server is running on port 7991");
});
