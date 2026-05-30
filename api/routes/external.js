const express = require('express');
const router = express.Router();
const axios = require('axios');

// --- GEOCODE ---
router.get('/external/geocode', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query is required' });
    const fetchFromNominatim = async (q) => {
        try {
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: { q, format: 'json', limit: 1 },
                headers: { 'User-Agent': 'DarmaxApp/1.0 (erick.rendon@galavi.com)' }
            });
            return response.data && response.data.length > 0 ? response.data[0] : null;
        } catch (error) { return null; }
    };
    try {
        let result = await fetchFromNominatim(query);
        if (result) return res.json({ lat: parseFloat(result.lat), lng: parseFloat(result.lon), displayName: result.display_name });
        res.json({ lat: null, lng: null });
    } catch (error) {
        res.status(502).json({ error: 'Geocoding unavailable' });
    }
});

// --- DIPOMEX ---
router.get('/external/dipomex/codigo_postal', async (req, res) => {
  const { cp } = req.query;
  if (!cp) return res.status(400).json({ error: 'CP is required' });
  try {
    const response = await axios.get('https://api.tau.com.mx/dipomex/v1/codigo_postal', { params: { cp }, headers: { 'APIKEY': process.env.DIPOMEX_API_KEY } });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching postal code' });
  }
});

module.exports = router;
