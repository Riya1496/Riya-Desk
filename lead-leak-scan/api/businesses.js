/**
 * GET /api/businesses?q=search&city=sydney
 *
 * Search for businesses using Google Places API
 * Returns autocomplete suggestions with business details
 */

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, city } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query too short' });
    }

    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('⚠️ GOOGLE_PLACES_API_KEY not configured');
      return res.json({ suggestions: [] });
    }

    // Search query with city context
    const searchQuery = city ? `${q} ${city}` : q;

    // Use Google Places Autocomplete API
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.append('input', searchQuery);
    url.searchParams.append('components', 'country:au'); // Australia focus
    url.searchParams.append('types', 'establishment'); // Businesses only
    url.searchParams.append('key', GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(`Google Places API error: ${response.status}`);
      return res.json({ suggestions: [] });
    }

    const data = await response.json();

    if (data.status === 'ZERO_RESULTS' || !data.predictions) {
      return res.json({ suggestions: [] });
    }

    // Format suggestions
    const suggestions = data.predictions.slice(0, 8).map(prediction => {
      // Extract main text (business name) and secondary text (address)
      const mainText = prediction.main_text || '';
      const secondaryText = prediction.secondary_text || '';

      return {
        name: mainText,
        address: secondaryText,
        placeId: prediction.place_id,
        description: mainText + (secondaryText ? ` • ${secondaryText}` : '')
      };
    });

    return res.json({ suggestions });
  } catch (error) {
    console.error('[API] Business search error:', error);
    return res.json({ suggestions: [] }); // Graceful fallback
  }
}
