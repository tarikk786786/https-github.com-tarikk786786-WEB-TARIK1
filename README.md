# UMATAXI - Premium Local Ride Booking Platform

![Dashboard Preview](https://via.placeholder.com/1200x500/000000/FABE2C?text=UMATAXI+-+Ride+Platform)

A completely open-source, mobile-first ride-booking platform. UMATAXI provides an elegant solution for customer bookings, a robust driver interface, and an advanced administrative control panel—**all powered without generic, paid APIs like Google Maps.**

Our 100% open mapping architecture relies entirely on free, open-source libraries (Leaflet, Nominatim Geocoding, and OSRM Routing).

## Features

- 🏎️ **Customer App:** Automatically detects user GPS, searches locations via Nominatim, calculates routing distance via OSRM, and generates dynamic pricing before redirecting to WhatsApp.
- 🚖 **Driver Panel:** Live geo-polling layout interface. Intercept nearby rides, check map coordinates, navigate missions, and earn virtual balances. 
- 🎛️ **Admin Control:** System health monitoring, automated fleet approval waitlist, and complete live configurations (Dynamic Matrix Pricing for every vehicle type).

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS (configured for ultra-premium Glassmorphic dark mode)
- **Animations:** Motion (`motion/react`)
- **Mapping Engine:** Leaflet & React-Leaflet
- **APIs:** Nominatim (Geocoding / Reverse Geocoding) & OSRM (Routing / Distance)
- **Backend Setup:** Express.js (runs within `server.ts`) simulating database operations in-memory.

## Setup & Run Locally

1. **Clone the configuration:**
   ```bash
   git clone https://github.com/your-repo/umataxi.git
   cd umataxi
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   > The application will run locally at `http://localhost:3000`. This mode actively recompiles via Vite and Express.

## Building for Production

If deploying to a static service or standard Node environment (Render, Heroku, DigitalOcean, etc.), ensure the Vite build process packages the frontend components first:

```bash
# Build the Vite React Frontend
npm run build

# Start the optimized Node Backend
npm run start
```
*Note: The `npm run start` script automatically serves the compiled `dist/` directory securely via Express.*

## Admin Access

If you need to tweak the core values or test the administrative functionality out of the box, log in to the admin panel with the credentials:

- **Access ID:** `admin`
- **Encryption Key:** `1234`

## License
MIT License
