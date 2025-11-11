import dotenv from 'dotenv';

dotenv.config();

async function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
  });
}

export default async function handler(request, response) {
  const { invoiceNumber, invoiceId } = request.query; // Aceptamos ambos por ahora
  const HIGHLEVEL_API_KEY = process.env.VITE_HIGHLEVEL_API_KEY;
  const BASE_URL = 'https://services.leadconnectorhq.com';

  const headers = {
    'Authorization': `Bearer ${HIGHLEVEL_API_KEY}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json',
  };

  const sendResponse = (res, statusCode, body) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  };

  try {
    if (request.method === 'GET') {
      const LOCATION_ID = process.env.VITE_HIGHLEVEL_LOCATION_ID;

      // Nueva lógica para buscar por número de factura
      if (invoiceNumber) {
        const listUrl = new URL(`${BASE_URL}/invoices/`);
        listUrl.searchParams.append('altId', LOCATION_ID);
        listUrl.searchParams.append('altType', 'location');
        listUrl.searchParams.append('limit', '99999');
        listUrl.searchParams.append('offset', '0');

        const apiResponse = await fetch(listUrl.toString(), { headers });
        const data = await apiResponse.json();

        if (!apiResponse.ok) {
          return sendResponse(response, apiResponse.status, data);
        }

        const foundInvoice = data.invoices.find(inv => inv.invoiceNumber === invoiceNumber);

        if (foundInvoice) {
          return sendResponse(response, 200, { invoice: foundInvoice });
        } else {
          return sendResponse(response, 404, { message: `Invoice with number ${invoiceNumber} not found.` });
        }
      }
      
      // Mantenemos la lógica anterior por si se necesita buscar por ID directamente
      if (invoiceId) {
        const url = new URL(`${BASE_URL}/invoices/${invoiceId}`);
        url.searchParams.append('altId', LOCATION_ID);
        url.searchParams.append('altType', 'location');
        const apiResponse = await fetch(url.toString(), { headers });
        const data = await apiResponse.json();
        return sendResponse(response, apiResponse.status, data);
      }

      return sendResponse(response, 400, { message: 'An invoiceNumber or invoiceId is required.' });
    }

    if (request.method === 'POST') {
      const requestBody = await getBody(request);
      const LOCATION_ID = process.env.VITE_HIGHLEVEL_LOCATION_ID;

      if (!invoiceId) {
        return sendResponse(response, 400, { message: 'Invoice ID is required' });
      }

      // El cuerpo de la solicitud ahora se construye en el frontend
      // y se pasa directamente aquí.
      const body = {
        ...requestBody,
        altId: LOCATION_ID, // Aseguramos que altId y altType estén presentes
        altType: 'location',
      };

      const apiResponse = await fetch(`${BASE_URL}/invoices/${invoiceId}/record-payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await apiResponse.json();

      return sendResponse(response, apiResponse.status, data);
    }

    response.setHeader('Allow', ['GET', 'POST']);
    return sendResponse(response, 405, { message: `Method ${request.method} Not Allowed` });

  } catch (error) {
    console.error('HighLevel API Error:', error);
    return sendResponse(response, 500, { message: 'Error processing request', error: error.message });
  }
}
