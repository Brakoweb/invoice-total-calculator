import { google } from 'googleapis';
import dotenv from 'dotenv';
import { getWeek, getYear } from 'date-fns';

dotenv.config();

// Función de ayuda para parsear el body de la petición
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

const HEADERS = [
  'Timestamp',
  'Location',
  'Client Name',
  'INV Number',
  'Subtotal',
  'Discount',
  'Cash',
  'Taxes',
  'Deposit',
  'Financing Fee',
  'Delivery Fee',
  'Laboratory Fee',
  'Final Total',
];

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ message: 'Only POST requests are allowed' }));
    return;
  }

  try {
    const body = await getBody(request);
    const spreadsheetId = process.env.VITE_GOOGLE_SHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Determinar el nombre de la hoja
    const now = new Date();
    const weekNumber = getWeek(now, { weekStartsOn: 1 }); // Lunes como inicio de semana
    const year = getYear(now);
    const sheetName = `Semana-${weekNumber}-${year}`;

    // 2. Verificar si la hoja existe
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheetInfo.data.sheets?.some(
      (s) => s.properties?.title === sheetName
    );

    // 3. Crear la hoja y añadir encabezados si no existe
    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            { addSheet: { properties: { title: sheetName, gridProperties: { rowCount: 1, columnCount: HEADERS.length } } } },
          ],
        },
      });
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [HEADERS] },
      });
    }

    // 4. Añadir los datos
    const rowData = [
      body.timestamp,
      body.officeName,
      body.clientName,
      body.invoiceNumber,
      body.subtotal,
      body.discount,
      body.cash,
      body.taxes,
      body.deposit,
      body.financingFee,
      body.deliveryFee,
      body.laboratoryFee,
      body.finalTotal,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] },
    });

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ message: 'Todo salio bien!' }));

  } catch (error) {
    console.error('Error... algo salio mal:', error);
    response.statusCode = 500;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ message: 'Error processing request', error: error.message }));
  }
}
