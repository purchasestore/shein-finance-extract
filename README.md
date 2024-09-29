# Shein Finance Extract

This React application processes Excel files and ZIP archives containing Excel files, specifically designed for financial data analysis. It provides a user-friendly interface for uploading files, processing data, and exporting results.

## Features

- Upload and process single Excel (.xlsx) files or ZIP archives containing multiple Excel files
- Filter data based on a start date
- Process large datasets efficiently using Web Workers
- Display processed data in a sortable table
- Export results as an Excel file or PNG image
- Progress indicator for file processing and data analysis

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/purchasestore/shein-finance-extract.git
   ```

2. Navigate to the project directory:
   ```
   cd shein-finance-extract
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Start the development server:
   ```
   npm start
   ```

2. Open your browser and visit `http://localhost:3000`

3. Use the interface to upload an Excel file or ZIP archive

4. (Optional) Set a start date for filtering the data

5. Click "Carregar Dados" to process the data

6. View the results in the table

7. Export the results as an Excel file or PNG image using the provided buttons

## Building for Production

To create a production build, run:
