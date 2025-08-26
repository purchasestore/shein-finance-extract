# Shein Finance Extract

A powerful React-based web application designed to process and analyze financial data from Shein Excel files and ZIP archives. This tool provides an intuitive interface for extracting, filtering, and exporting financial information with advanced data processing capabilities.

## 🚀 Features

### Core Functionality
- **Multi-format Support**: Process single Excel (.xlsx) files or ZIP archives containing multiple Excel files
- **Smart Data Processing**: Automatically detects and processes financial data columns
- **Date Filtering**: Filter data based on customizable start dates
- **Performance Optimized**: Utilizes Web Workers for efficient processing of large datasets
- **Real-time Progress**: Visual progress indicators for file processing and data analysis

### Data Management
- **Interactive Table**: Sortable data table with comprehensive financial information display
- **Data Validation**: Automatic detection of required financial columns
- **Error Handling**: Robust error handling with user-friendly notifications

### Export Capabilities
- **Excel Export**: Download processed data as formatted Excel files
- **Image Export**: Generate PNG images of data tables for reporting
- **Flexible Formats**: Multiple export options for different use cases

## 🛠️ Technology Stack

- **Frontend**: React 18.3.1 with modern hooks and functional components
- **Styling**: Tailwind CSS with custom form and typography plugins
- **Data Processing**: XLSX library for Excel file handling
- **File Handling**: JSZip for ZIP archive processing
- **Date Management**: date-fns with Brazilian Portuguese localization
- **Export Tools**: html2canvas for image generation, file-saver for downloads
- **Build Tool**: Create React App with optimized production builds

## 📋 Prerequisites

Before running this application, ensure you have:

- **Node.js**: Version 14.0.0 or later
- **npm**: Version 6.0.0 or later
- **Modern Browser**: Chrome, Firefox, Safari, or Edge with ES6+ support

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/purchasestore/shein-finance-extract.git
cd shein-finance-extract
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm start
```

The application will open automatically in your default browser at `http://localhost:3000`

## 📖 Usage Guide

### Step-by-Step Process

1. **Launch Application**
   - Start the development server with `npm start`
   - Navigate to `http://localhost:3000` in your browser

2. **Upload Files**
   - **Drag & Drop**: Simply drag Excel (.xlsx) or ZIP files onto the upload area
   - **File Browser**: Click the upload area to browse and select files
   - **Supported Formats**: 
     - Single Excel files (.xlsx)
     - ZIP archives containing multiple Excel files

3. **Configure Processing**
   - **Optional Date Filter**: Set a start date to filter data from that point forward
   - **Automatic Detection**: The app automatically detects required financial columns

4. **Process Data**
   - Click "Carregar Dados" to begin data processing
   - Monitor progress with real-time progress indicators
   - View processing results in the interactive table

5. **Export Results**
   - **Excel Export**: Download processed data as an Excel file
   - **Image Export**: Generate PNG images of the data table
   - **Multiple Formats**: Export in various formats for different reporting needs

### Supported Data Columns

The application automatically detects and processes the following financial columns:
- **Data de início da liquidação** (Settlement start date)
- **Data de solicitação de liquidação** (Settlement request date)
- **Contas a receber** (Accounts receivable)
- **Valor a receber** (Amount receivable)

## 🏗️ Building for Production

### Create Production Build
```bash
npm run build
```

### Test Production Build
```bash
npm test
```

### Available Scripts
- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App (advanced users only)

## 🔧 Configuration

### Tailwind CSS
The application uses Tailwind CSS for styling with custom configurations:
- Form styling with `@tailwindcss/forms`
- Typography enhancements with `@tailwindcss/typography`
- Custom color schemes and responsive design

### Date Localization
- Brazilian Portuguese (pt-BR) date formatting
- Customizable date picker with locale support
- Flexible date input formats

## 📁 Project Structure

```
shein-finance-extract/
├── public/                 # Static assets and HTML template
├── src/                    # Source code
│   ├── App.js             # Main application component
│   ├── dataWorker.js      # Web Worker for data processing
│   ├── index.js           # Application entry point
│   └── ...                # Additional components and utilities
├── package.json            # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md              # This file
```

## 🐛 Troubleshooting

### Common Issues

**File Upload Errors**
- Ensure files are in .xlsx format or contained in .zip archives
- Check file size limits (large files may take longer to process)
- Verify file integrity and format

**Data Processing Issues**
- Confirm Excel files contain the required financial columns
- Check date format consistency in your data
- Ensure ZIP files contain valid Excel files

**Performance Issues**
- Large datasets are processed using Web Workers for optimal performance
- Progress indicators show processing status
- Consider breaking very large files into smaller chunks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed for Purchase Store. All rights reserved.

## 📞 Support

For technical support or feature requests, please contact the development team or create an issue in the repository.

---

**Note**: This application is specifically designed for processing Shein financial data and may require specific data formats for optimal functionality.
