import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { parse, parseISO, format, isValid, differenceInDays, addDays } from 'date-fns';
import html2canvas from 'html2canvas';

function App() {
  const [data, setData] = useState(null);
  const [startDateStr, setStartDateStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rawData, setRawData] = useState(null);
  const tableRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const binaryStr = evt.target.result;
      const wb = XLSX.read(binaryStr, { type: 'binary' });

      // Assuming the data is in the first sheet
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      // Convert the sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });

      // Set the raw data to state
      setRawData(jsonData);
    };
    reader.readAsBinaryString(file);
  };

  const handleLoadData = () => {
    if (!rawData) {
      alert('Por favor, carregue um arquivo Excel primeiro.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const processedData = processData(rawData);
      setData(processedData);
      setIsLoading(false);
    }, 0);
  };

  const processData = (jsonData) => {
    const portugueseToEnglishMonths = {
      'janeiro': 'January',
      'fevereiro': 'February',
      'março': 'March',
      'abril': 'April',
      'maio': 'May',
      'junho': 'June',
      'julho': 'July',
      'agosto': 'August',
      'setembro': 'September',
      'outubro': 'October',
      'novembro': 'November',
      'dezembro': 'December'
    };

    const convertDate = (date) => {
      if (!date) return null;

      let dateStr = date.toString().toLowerCase().trim();

      // Replace Portuguese month names with English ones
      for (const [ptMonth, enMonth] of Object.entries(portugueseToEnglishMonths)) {
        if (dateStr.includes(ptMonth)) {
          dateStr = dateStr.replace(ptMonth, enMonth.toLowerCase());
          break; // Month found and replaced
        }
      }

      // Attempt to parse date
      const parsedDate = parse(dateStr, 'd MMMM yyyy', new Date());
      if (isValid(parsedDate)) {
        return parsedDate;
      }

      // Fallback for other formats
      const fallbackDate = new Date(date);
      return isValid(fallbackDate) ? fallbackDate : null;
    };

    const formatReal = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    };

    // Clean and process data
    const cleanedData = jsonData.map((row) => {
      const newRow = { ...row };

      // Trim column names and values to avoid extra spaces
      Object.keys(newRow).forEach((key) => {
        const trimmedKey = key.trim();
        if (trimmedKey !== key) {
          newRow[trimmedKey] = newRow[key];
          delete newRow[key];
        }

        // Trim string values
        if (typeof newRow[trimmedKey] === 'string') {
          newRow[trimmedKey] = newRow[trimmedKey].trim();
        }
      });

      // Convert 'Data de início da liquidação' to Date object
      newRow['Data de início da liquidação'] = convertDate(newRow['Data de início da liquidação']);

      // Ensure 'Contas a receber' is a number
      const contasReceberStr = newRow['Contas a receber'] ? newRow['Contas a receber'].toString().replace('BRL ', '') : '0';
      const contasReceber = parseFloat(contasReceberStr.replace(/\./g, '').replace(',', '.')) || 0;
      newRow['Contas a receber'] = contasReceber / 100; // Convert cents to reais

      return newRow;
    });

    // Remove rows with invalid dates
    const validData = cleanedData.filter((row) => row['Data de início da liquidação'] !== null);

    // Sort data by date
    validData.sort((a, b) => {
      const dateA = a['Data de início da liquidação'];
      const dateB = b['Data de início da liquidação'];
      return dateA - dateB;
    });

    // Filter data based on start date (if provided)
    let filteredData = validData;
    if (startDateStr.trim() !== '') {
      const startDate = parse(startDateStr, 'dd-MM-yyyy', new Date());
      filteredData = validData.filter((row) => {
        const date = row['Data de início da liquidação'];
        return date && date >= startDate;
      });
    }

    // Add 'Renda Count' column
    filteredData.forEach((row) => {
      row['Renda Count'] = row['Contas a receber'] > 0 ? 1 : 0;
    });

    // Group data with 1-day difference
    const groupedResultsWithCount = {};
    let previousDate = null;

    filteredData.forEach((row) => {
      const currentDate = row['Data de início da liquidação'];
      let groupDate = currentDate;

      if (previousDate && differenceInDays(currentDate, previousDate) <= 1) {
        groupDate = previousDate;
      } else {
        groupDate = currentDate;
      }

      const groupKey = format(groupDate, 'yyyy-MM-dd');

      if (!groupedResultsWithCount[groupKey]) {
        groupedResultsWithCount[groupKey] = { 'Renda': 0, 'Despesa': 0, 'Renda Count': 0 };
      }

      const contasAReceber = row['Contas a receber'];
      if (contasAReceber > 0) {
        groupedResultsWithCount[groupKey]['Renda'] += contasAReceber;
      } else {
        groupedResultsWithCount[groupKey]['Despesa'] += Math.abs(contasAReceber);
      }

      groupedResultsWithCount[groupKey]['Renda Count'] += row['Renda Count'];

      previousDate = groupDate;
    });

    // Convert grouped results to an array
    const resultsArray = Object.keys(groupedResultsWithCount).map((key) => {
      const item = groupedResultsWithCount[key];
      item['Grouped Date'] = format(parseISO(key), 'dd-MM-yyyy');
      return item;
    });

    // Recalculate 'Montante Fixo' and 'Percentual Despesa'
    resultsArray.forEach((item) => {
      item['Montante Fixo'] = item['Renda'] - item['Despesa'];
      item['Percentual Despesa'] = item['Renda'] !== 0 ? (item['Despesa'] / item['Renda']) * 100 : 0;
      item['Recebimento médio por pedido'] = item['Renda Count'] !== 0 ? item['Montante Fixo'] / item['Renda Count'] : 0;
    });

    // Format numbers and percentages
    resultsArray.forEach((item) => {
      item['Renda'] = formatReal(item['Renda']);
      item['Despesa'] = formatReal(item['Despesa']);
      item['Montante Fixo'] = formatReal(item['Montante Fixo']);
      item['Recebimento médio por pedido'] = formatReal(item['Recebimento médio por pedido']);
      item['Percentual Despesa'] = item['Percentual Despesa'].toFixed(2) + '%';
    });

    // Rename and reorder columns
    resultsArray.forEach((item) => {
      item['Pedidos recebidos'] = item['Renda Count'];
      delete item['Renda Count'];
    });

    const columnOrder = [
      'Grouped Date',
      'Renda',
      'Despesa',
      'Montante Fixo',
      'Percentual Despesa',
      'Pedidos recebidos',
      'Recebimento médio por pedido',
    ];

    const finalData = resultsArray.map((item) => {
      const orderedItem = {};
      columnOrder.forEach((col) => {
        orderedItem[col] = item[col];
      });
      return orderedItem;
    });

    return finalData;
  };

  const handleExportImage = () => {
    if (tableRef.current) {
      html2canvas(tableRef.current).then((canvas) => {
        const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const link = document.createElement('a');
        link.download = 'table-export.png';
        link.href = image;
        link.click();
      });
    }
  };

  return (
    <div className="App bg-gray-100 min-h-screen p-8">
      <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">Processamento de Dados Excel</h1>
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
          Carregar Arquivo Excel
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileUpload}
          accept=".xlsx, .xls"
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
          "
        />
      </div>
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
          Data de Início (dd-MM-yyyy) - Deixe em branco para todos os dados
        </label>
        <input
          id="start-date"
          type="text"
          value={startDateStr}
          onChange={(e) => setStartDateStr(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="dd-MM-yyyy"
        />
      </div>
      <div className="max-w-xl mx-auto mb-8">
        <button
          onClick={handleLoadData}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Carregar Dados
        </button>
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center mt-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-lg text-gray-700">Processando dados...</p>
        </div>
      ) : data && data.length > 0 ? (
        <>
          <div className="mb-4">
            <button
              onClick={handleExportImage}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Exportar como Imagem
            </button>
          </div>
          <div className="overflow-x-auto" ref={tableRef}>
            <table className="min-w-full bg-white border border-gray-300 shadow-sm rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(data[0]).map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translateHeader(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    {Object.values(row).map((val, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

function translateHeader(header) {
  const translations = {
    'Grouped Date': 'Data Agrupada',
    'Renda': 'Renda',
    'Despesa': 'Despesa',
    'Montante Fixo': 'Montante Fixo',
    'Percentual Despesa': 'Percentual de Despesa',
    'Pedidos recebidos': 'Pedidos Recebidos',
    'Recebimento médio por pedido': 'Recebimento Médio por Pedido'
  };
  return translations[header] || header;
}

export default App;