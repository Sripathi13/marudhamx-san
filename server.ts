import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cropsData from './src/data/crops.json' with { type: 'json' };
import marketsData from './src/data/markets.json' with { type: 'json' };
import vehiclesData from './src/data/vehicles.json' with { type: 'json' };
import { calculateShipmentPlan, defaultSettings, SettingsState } from './src/services/realRoadRouter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// In-memory persistent stores for shipments & settings
let serverSettings: SettingsState = { ...defaultSettings };
const shipmentsStore = new Map<string, any>();

// Reverse geocode cache with language key
const geocodeCache = new Map<string, string>();

// GET /api/meta/crops
app.get('/api/meta/crops', (_req: Request, res: Response) => {
  res.json(cropsData.crops);
});

// GET /api/meta/markets
app.get('/api/meta/markets', (_req: Request, res: Response) => {
  res.json(marketsData.markets);
});

// GET /api/meta/i18n-version
app.get('/api/meta/i18n-version', (_req: Request, res: Response) => {
  res.json({ version: '2.0.0', supported: ['en', 'ta', 'hi'] });
});

// GET /api/settings
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(serverSettings);
});

// PUT /api/settings
app.put('/api/settings', (req: Request, res: Response) => {
  serverSettings = { ...serverSettings, ...req.body };
  res.json({ success: true, settings: serverSettings });
});

// POST /api/shipments/plan
// Must return stable codes for errors without English prose (Part 1.2)
app.post('/api/shipments/plan', async (req: Request, res: Response) => {
  try {
    const { origin, destination, crop, total_kg, truck_capacity_kg, departure_time } = req.body;

    if (!total_kg || total_kg <= 0) {
      return res.status(400).json({ code: 'QUANTITY_INVALID' });
    }

    if (!truck_capacity_kg || truck_capacity_kg <= 0) {
      return res.status(400).json({ code: 'CAPACITY_INVALID' });
    }

    if (!origin || !destination) {
      return res.status(400).json({ code: 'ORIGIN_REQUIRED' });
    }

    const result = await calculateShipmentPlan(
      origin,
      destination,
      crop || 'tomato',
      Number(total_kg),
      Number(truck_capacity_kg),
      departure_time || new Date().toISOString(),
      serverSettings
    );

    shipmentsStore.set(result.shipmentId, result);
    res.json(result);
  } catch (err: any) {
    const code = err.message === 'QUANTITY_INVALID' || err.message === 'CAPACITY_INVALID'
      ? err.message
      : 'ROUTING_FAILED';
    res.status(500).json({ code });
  }
});

// GET /api/shipments
app.get('/api/shipments', (_req: Request, res: Response) => {
  const all = Array.from(shipmentsStore.values()).reverse();
  res.json(all);
});

// GET /api/shipments/:id
app.get('/api/shipments/:id', (req: Request, res: Response) => {
  const item = shipmentsStore.get(req.params.id);
  if (!item) {
    return res.status(404).json({ code: 'NOT_FOUND' });
  }
  res.json(item);
});

// GET /api/shipments/:id/export.csv
app.get('/api/shipments/:id/export.csv', (req: Request, res: Response) => {
  const item = shipmentsStore.get(req.params.id);
  if (!item) {
    return res.status(404).send('Not Found');
  }

  const lang = (req.query.lang as string) || 'en';
  const best = item.routes.find((r: any) => r.id === item.recommendedRouteId) || item.routes[0];

  const headers = lang === 'ta'
    ? '\uFEFFதேதி,பயிர்,அளவு (கிலோ),லாரிகள்,ஏற்றுமிடம்,சேருமிடம்,பாதை,தூரம் (கி.மீ.),செலவு (₹),மொத்த இழப்பு (₹)\n'
    : 'Date,Crop,TotalKg,Trucks,Origin,Destination,Route,DistanceKm,TransportCostINR,TotalCostINR\n';

  const row = `"${item.timestamp}","${item.cropId}",${item.totalKg},${item.trucksNeeded},"${item.origin.name}","${item.destination.name}","${best.id}",${best.distance_km},${best.transportCostInr},${best.totalEconomicCostInr}\n`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${item.shipmentId}.csv"`);
  res.send(headers + row);
});

// GET /api/geocode/reverse?lat=&lng=&lang=
app.get('/api/geocode/reverse', async (req: Request, res: Response) => {
  const lat = req.query.lat as string;
  const lng = req.query.lng as string;
  const lang = (req.query.lang as string) || 'en';

  if (!lat || !lng) {
    return res.status(400).json({ code: 'COORDS_REQUIRED' });
  }

  const cacheKey = `${lat},${lng},${lang}`;
  if (geocodeCache.has(cacheKey)) {
    return res.json({ address: geocodeCache.get(cacheKey) });
  }

  try {
    const fetchRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=${lang}`,
      { headers: { 'User-Agent': 'MarudhamX-App/2.0' } }
    );
    if (fetchRes.ok) {
      const data = await fetchRes.json();
      const addr = data.display_name || `${lat}, ${lng}`;
      geocodeCache.set(cacheKey, addr);
      return res.json({ address: addr });
    }
  } catch {
    // fallback
  }

  res.json({ address: `${lat}, ${lng}` });
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', project: 'MarudhamX', i18n: 'strict' });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT) || 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`MarudhamX server active on port ${port}`);
  });
}

startServer();
