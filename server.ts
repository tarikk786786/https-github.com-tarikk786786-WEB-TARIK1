import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Internal Data ---
  let rides = [];
  let bugs = [];
  const drivers = [
    { id: 'd1', name: 'Ravi Kumar', vehicle: 'Swift Dzire', rating: 4.8, location: { lat: 23.79, lng: 86.43 }, status: 'available', earnings: 1250, phone: '9876543210', isApproved: true },
    { id: 'd2', name: 'Suresh Das', vehicle: 'Ertiga', rating: 4.9, location: { lat: 23.80, lng: 86.44 }, status: 'available', earnings: 850, phone: '9876543211', isApproved: true },
  ];

  let appConfig = {
    appName: "UMATAXI",
    whatsapp: "917787860016",
    upiId: "917787860016@ybl",
    serviceStatus: "Active",
    radius: 15 // km
  };

  // Default pricing
  let vehiclePricing = {
    bike: { label: 'Bike', base: 20, perkm: 5 },
    auto: { label: 'Auto', base: 20, perkm: 8 },
    mini: { label: 'Mini', base: 20, perkm: 10 },
    sedan: { label: 'Sedan', base: 20, perkm: 12 },
    suv: { label: 'Premium', base: 20, perkm: 15 }
  };

  app.get("/api/pricing", (req, res) => {
    res.json(vehiclePricing);
  });

  app.post("/api/pricing", (req, res) => {
    vehiclePricing = { ...vehiclePricing, ...req.body };
    res.json({ status: "success", pricing: vehiclePricing });
  });

  app.get("/api/config", (req, res) => {
    res.json(appConfig);
  });

  app.post("/api/config", (req, res) => {
    appConfig = { ...appConfig, ...req.body };
    res.json({ status: "success", config: appConfig });
  });

  app.get("/api/drivers", (req, res) => {
    res.json(drivers);
  });

  app.post("/api/drivers/approve", (req, res) => {
    const { driverId, approve } = req.body;
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      driver.isApproved = approve;
      res.json({ status: "success", driver });
    } else {
      res.status(404).json({ status: "error" });
    }
  });

  app.post("/api/driver/register", (req, res) => {
    const newDriver = {
      id: `d-${Date.now()}`,
      ...req.body,
      rating: 5.0,
      location: { lat: 23.79, lng: 86.43 },
      status: 'available',
      earnings: 0,
      isApproved: false // Needs admin validation
    };
    drivers.push(newDriver);
    res.json({ status: "success", driver: newDriver });
  });

  app.post("/api/book-ride", (req, res) => {
    // Basic Auto-Assignment Logic - Only approved drivers
    const availableDriver = drivers.find(d => d.status === 'available' && d.isApproved);
    
    const ride = {
      id: `r-${Date.now()}`,
      ...req.body,
      status: availableDriver ? 'accepted' : 'pending',
      driverId: availableDriver ? availableDriver.id : null,
      createdAt: new Date().toISOString()
    };
    
    if (availableDriver) {
      availableDriver.status = 'busy';
    }
    
    rides.push(ride);
    res.json({ status: "success", ride });
  });

  app.get("/api/rides", (req, res) => {
    res.json(rides);
  });

  // --- Driver Panel Endpoints ---
  app.post("/api/driver/login", (req, res) => {
    const { driverId } = req.body;
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      res.json({ status: "success", driver });
    } else {
      res.status(404).json({ status: "error", message: "Driver not found" });
    }
  });

  app.post("/api/ride/update-status", (req, res) => {
    const { rideId, status, driverId } = req.body;
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      const oldStatus = ride.status;
      ride.status = status;
      if (driverId) ride.driverId = driverId;
      
      // If completed, add to driver earnings (only if not already completed)
      if (status === 'completed' && oldStatus !== 'completed' && driverId) {
        const driver = drivers.find(d => d.id === driverId);
        if (driver) {
          driver.earnings += ride.fare;
          driver.status = 'available'; // Set driver back to available
        }
      }
      
      res.json({ status: "success", ride });
    } else {
      res.status(404).json({ status: "error", message: "Ride not found" });
    }
  });

  app.post("/api/driver/location", (req, res) => {
    const { driverId, location } = req.body;
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      driver.location = location;
      res.json({ status: "success" });
    } else {
      res.status(404).json({ status: "error", message: "Driver not found" });
    }
  });

  // --- Bug Reporting & Admin ---
  app.post("/api/report-bug", (req, res) => {
    const bug = {
      id: `b-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    bugs.push(bug);
    res.json({ status: "success", bug });
  });

  app.get("/api/bugs", (req, res) => {
    res.json(bugs);
  });

  app.post("/api/admin/maintenance", (req, res) => {
    // Just a placeholder for maintenance toggle
    res.json({ status: "success", message: "Maintenance mode toggled" });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
