import { NextResponse } from 'next/server';
import https from 'https';

const DOCUMENT_TYPES = [
    { "id": "V", "name": "VENEZOLANO" },
    { "id": "E", "name": "EXTRANJERO" },
    { "id": "J", "name": "JURIDICO" },
    { "id": "C", "name": "COMUNA" },
    { "id": "G", "name": "GUBERNAMENTAL" }
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); 
  const parent_id = searchParams.get('parent_id');
  const BASE_URL = process.env.ODOO_API_URL;
  const API_KEY = process.env.ODOO_API_KEY;

  if (type === 'doc_types') return NextResponse.json(DOCUMENT_TYPES);
  
  let endpoint = '';
  if (type === 'states') endpoint = '/locations/states'; 
  else if (type === 'municipalities') endpoint = `/locations/municipalities${parent_id ? `?state_id=${parent_id}` : ''}`; 
  else if (type === 'parishes') endpoint = `/locations/parishes${parent_id ? `?municipality_id=${parent_id}` : ''}`; 
  else return NextResponse.json([]);

  const targetUrl = `${BASE_URL}${endpoint}`;

  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const res = await fetch(targetUrl, {
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY || '' },
      cache: 'no-store',
      agent: process.env.NODE_ENV === 'development' ? agent : undefined
    });
    
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    let items = Array.isArray(data) ? data : (data.result || data.data || []);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error in maestros proxy:', error);
    return NextResponse.json([]);
  }
}
