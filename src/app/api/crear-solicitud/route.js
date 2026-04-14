import { NextResponse } from 'next/server';

// Campos permitidos en el payload (whitelist estricta)
const ALLOWED_FIELDS = [
  'name_person',
  'last_name_person',
  'tax_id_number_person',
  'tax_id_document_type_person',
  'phone',
  'mobile',
  'email',
  'tax_id_number',
  'tax_id_document_type',
  'legal_name',
  'commercial_name',
  'fiscal_address',
  'service_location',
  'fiscal_state_id',
  'fiscal_municipality_id',
  'fiscal_parish_id',
  'service_state_id',
  'service_municipality_id',
  'service_parish_id',
  'document_date',
  'business_opening_date',
  'cnae_description',
  'area_size_full',
  'area_size_util',
  'electricity_contract',
  'tenancy_type',
  'workers_count',
  'tables_count',
  'tax_id_photo',
  'rental_contract_photo',
];

// Campos que son strings de texto libre (se sanitizan)
const TEXT_FIELDS = [
  'name_person', 'last_name_person', 'legal_name', 'commercial_name',
  'fiscal_address', 'service_location', 'cnae_description', 'email',
  'phone', 'mobile', 'electricity_contract',
];

// Límite de tamaño del body: 15 MB (para soportar hasta 2 PDFs de 5MB en base64)
const MAX_BODY_SIZE_BYTES = 15 * 1024 * 1024;

// Sanitizar texto: trim + eliminar tags HTML
function sanitizeText(value) {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/<[^>]*>/g, '');
}

export async function POST(request) {
  const ODOO_URL = `${process.env.ODOO_API_URL}/inspections/request`;
  const API_KEY = process.env.ODOO_API_KEY;

  if (!ODOO_URL || !API_KEY) {
    console.error('[crear-solicitud] Missing environment variables');
    return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
  }

  // --- Protección CSRF: validar Origin / Referer ---
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  if (origin && host && !origin.includes(host)) {
    console.error(`[crear-solicitud] CSRF blocked: origin=${origin} host=${host}`);
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  if (!origin && referer && host && !referer.includes(host)) {
    console.error(`[crear-solicitud] CSRF blocked: referer=${referer} host=${host}`);
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // Verificar tamaño del body antes de parsear
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_SIZE_BYTES) {
    return NextResponse.json({ success: false, error: 'Payload too large' }, { status: 413 });
  }

  try {
    const rawBody = await request.json();

    // Construir payload con solo los campos permitidos (whitelist) + sanitización
    const sanitizedBody = {};
    for (const field of ALLOWED_FIELDS) {
      if (rawBody[field] !== undefined) {
        sanitizedBody[field] = TEXT_FIELDS.includes(field)
          ? sanitizeText(rawBody[field])
          : rawBody[field];
      }
    }

    const response = await fetch(ODOO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(sanitizedBody),
    });

    const data = await response.json();

    if (!response.ok) {
      // Loggear el error real en servidor, devolver mensaje genérico al cliente
      const serverMsg = data.message || data.error || `HTTP ${response.status}`;
      console.error(`[crear-solicitud] Odoo error: ${serverMsg}`);
      return NextResponse.json(
        { success: false, error: 'No se pudo procesar la solicitud. Por favor intente nuevamente.' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[crear-solicitud] Internal error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
