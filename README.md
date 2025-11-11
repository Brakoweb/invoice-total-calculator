# Invoice Total Calculator

![Invoice Calculator Banner](https://private-user-images.githubusercontent.com/35389136/512254540-e9afa522-3554-4000-a906-16ae65ec295f.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjI3OTA2ODYsIm5iZiI6MTc2Mjc5MDM4NiwicGF0aCI6Ii8zNTM4OTEzNi81MTIyNTQ1NDAtZTlhZmE1MjItMzU1NC00MDAwLWE5MDYtMTZhZTY1ZWMyOTVmLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTExMTAlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUxMTEwVDE1NTk0NlomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWIyYzg5ZmVkNTY5Yjc3ZmM0NTkxMWUxMjg2OTAyNjBjODYyOGNjOTJlNDNlYzM4ODBlODhhOWQxNDkwNzdiYTQmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.DyDCqcgIOnabsXtCcB3rmEV4t0EBde5jwbxNhoIdtSs)

An elegant and powerful web application designed to calculate final invoice totals in real-time. This tool is tailored for businesses that handle complex calculations involving subtotals, discounts, taxes, fees, and deposits. The application features a clean, modern interface and seamless integration with Google Sheets for data logging.

---

## ✨ Key Features

- **Real-Time Calculation**: All financial fields update instantly as you type.
- **Dynamic Fees**: Easily apply or remove optional fees like financing, delivery, and laboratory exams with simple checkboxes.
- **Multi-Location Support**: A toggle allows switching between different business locations ("Royal Beauty" and "Lale's Plastic Surgery"), each with its own validation rules (e.g., invoice number requirement).
- **Data Persistence**: Automatically sends the final invoice data to a Google Sheet, creating a new sheet for each week to keep data organized.
- **Professional Invoicing**: A print-friendly format allows generating a clean, professional-looking invoice directly from the browser.
- **Modern UI/UX**: Built with Tailwind CSS for a responsive, dark-mode interface, and uses toast notifications for non-intrusive user feedback.
- **Input Validation**: Smart validation ensures data integrity, such as requiring specific fields and formatting invoice numbers to a 6-digit standard.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: React Spring
- **Notifications**: Sonner (Toast)
- **Backend (Serverless Function)**: Node.js
- **API Integration**: Google Sheets API
- **Deployment**: Vercel

## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

- Node.js (v18 or later)

3. **Set up environment variables:**
   - Create a `.env` file in the root of the project.
   - Add the necessary credentials for the Google Sheets API:
     ```
     VITE_GOOGLE_SHEET_ID=your_spreadsheet_id
     VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
     VITE_GOOGLE_PRIVATE_KEY=your_private_key
     ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## ☁️ Deployment

This project is configured for seamless deployment on **Vercel**.

1. **Push to GitHub**: All changes pushed to the `main` branch will trigger an automatic deployment.
2. **Environment Variables**: The same variables from the `.env` file must be configured in the Vercel project settings (**Settings -> Environment Variables**).
3. **Custom Domain**: The project is set up to use a custom domain, which can be configured in **Settings -> Domains**.

## ⚙️ API & Backend

The backend logic resides in the `/api` directory as a serverless function, automatically handled by Vercel.

- `api/sendToSheet.js`: This function handles POST requests from the frontend. It authenticates with the Google Sheets API, determines the correct sheet name based on the current week (`Semana-XX-YYYY`), creates the sheet with headers if it doesn't exist, and appends the new invoice data as a row.
