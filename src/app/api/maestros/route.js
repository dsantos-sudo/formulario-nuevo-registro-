import { NextResponse } from 'next/server';

const DOCUMENT_TYPES = [
    { "id": "V", "name": "VENEZOLANO" },
    { "id": "E", "name": "EXTRANJERO" },
    { "id": "J", "name": "JURIDICO" },
    { "id": "C", "name": "COMUNA" },
    { "id": "G", "name": "GUBERNAMENTAL" }
];

// Tipos de consulta permitidos (whitelist)
const ALLOWED_TYPES = ['doc_types', 'states', 'municipalities', 'parishes'];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const parent_id = searchParams.get('parent_id');

  // Validar que el tipo sea uno de los permitidos
  if (!type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  }

  if (type === 'doc_types') return NextResponse.json(DOCUMENT_TYPES);

  const BASE_URL = process.env.ODOO_API_URL;
  const API_KEY = process.env.ODOO_API_KEY;

  if (!BASE_URL || !API_KEY) {
    console.error('[maestros] Missing environment variables');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Validar parent_id: solo números enteros positivos
  let safeParentId = null;
  if (parent_id !== null && parent_id !== undefined) {
    const parsed = parseInt(parent_id, 10);
    if (isNaN(parsed) || parsed <= 0 || String(parsed) !== parent_id.trim()) {
      return NextResponse.json({ error: 'Invalid parent_id' }, { status: 400 });
    }
    safeParentId = parsed;
  }

  let endpoint = '';
  if (type === 'states') {
    endpoint = '/locations/states';
  } else if (type === 'municipalities') {
    endpoint = `/locations/municipalities${safeParentId ? `?state_id=${safeParentId}` : ''}`;
  } else if (type === 'parishes') {
    endpoint = `/locations/parishes${safeParentId ? `?municipality_id=${safeParentId}` : ''}`;
  }

  const targetUrl = `${BASE_URL}${endpoint}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`[maestros] Odoo responded with ${res.status} for type=${type}`);
      return NextResponse.json([]);
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.result || data.data || []);
    return NextResponse.json(items);
  } catch (error) {
    console.error('[maestros] Proxy error:', error);
    return NextResponse.json([]);
  }
}
