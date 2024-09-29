import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from 'date-fns/locale';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function App() {
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawData, setRawData] = useState(null);
  const tableRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setProgress(0);

    try {
      let jsonData = [];
      if (file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const zipContents = await zip.loadAsync(file, {
          onProgress: (metadata) => {
            setProgress(Math.round((metadata.percent / 2) * 100));
          }
        });
        const excelFiles = Object.keys(zipContents.files).filter(name => name.endsWith('.xlsx'));

        for (let i = 0; i < excelFiles.length; i++) {
          const fileName = excelFiles[i];
          const fileData = await zipContents.file(fileName).async('arraybuffer');
          const workbook = XLSX.read(fileData, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const fileJsonData = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
          jsonData.push(...fileJsonData);
          setProgress(50 + Math.round(((i + 1) / excelFiles.length) * 50));
        }
      } else if (file.name.endsWith('.xlsx')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
        setProgress(100);
      } else {
        throw new Error('Formato de arquivo não suportado');
      }

      setRawData(jsonData);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Erro ao processar o arquivo: ' + error.message);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleLoadData = () => {
    if (!rawData) {
      alert('Por favor, carregue um arquivo Excel ou ZIP primeiro.');
      return;
    }
    setIsLoading(true);
    setProgress(0);

    const worker = new Worker(new URL('./dataWorker.js', import.meta.url));
    
    worker.onmessage = (event) => {
      const { type, data, progress } = event.data;
      if (type === 'progress') {
        setProgress(progress);
      } else if (type === 'result') {
        setData(data);
        setIsLoading(false);
        setProgress(0);
      } else if (type === 'error') {
        console.error('Error in worker:', data);
        alert('Erro ao processar os dados. Por favor, tente novamente.');
        setIsLoading(false);
        setProgress(0);
      }
    };

    worker.postMessage({ rawData, startDate });
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

  const handleExportExcel = () => {
    if (!data) return;

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Processed Data");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(dataBlob, 'processed_data.xlsx');
  };

  return (
    <div className="App bg-gray-100 min-h-screen p-8">
      <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">Processamento de Dados Excel</h1>
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
          Carregar Arquivo Excel ou ZIP
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileUpload}
          accept=".xlsx, .zip"
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
          Data de Início - Deixe em branco para todos os dados
        </label>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          dateFormat="dd/MM/yyyy"
          locale={ptBR}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholderText="Selecione uma data"
          isClearable
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
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <div className="mb-4">Processando... {progress}%</div>
            <div className="w-64 h-6 bg-gray-200 rounded-full">
              <div
                className="h-6 bg-blue-600 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center mt-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-lg text-gray-700">Processando dados...</p>
        </div>
      ) : data && data.length > 0 ? (
        <>
          <div className="mb-4">
            <button
              onClick={handleExportExcel}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mr-2"
            >
              Exportar Excel
            </button>
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