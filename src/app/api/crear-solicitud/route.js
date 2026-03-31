import { NextResponse } from 'next/server';
import https from 'https';

export async function POST(request) {
  const ODOO_URL = `${process.env.ODOO_API_URL}/inspections/request`;
  const API_KEY = process.env.ODOO_API_KEY;

  try {
    const body = await request.json();
    
    // Agente para ignorar certificados en desarrollo, tal cual pide la documentación
    const agent = new https.Agent({ rejectUnauthorized: false });
    
    const response = await fetch(ODOO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY || '',
      },
      body: JSON.stringify(body),
      agent: process.env.NODE_ENV === 'development' ? agent : undefined
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        const msg = data.message || data.error || `Error ${response.status}`;
        throw new Error(msg);
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
