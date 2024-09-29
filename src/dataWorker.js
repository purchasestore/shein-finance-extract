/* eslint-disable */
import { parse, isValid, differenceInDays, format } from 'date-fns';

self.onmessage = (event) => {
  const { rawData, startDate } = event.data;
  try {
    const result = processData(rawData, startDate);
    self.postMessage({ type: 'result', data: result });
  } catch (error) {
    self.postMessage({ type: 'error', data: error.message });
  }
};

function processData(jsonData, startDate) {
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

    for (const [ptMonth, enMonth] of Object.entries(portugueseToEnglishMonths)) {
      if (dateStr.includes(ptMonth)) {
        dateStr = dateStr.replace(ptMonth, enMonth.toLowerCase());
        break;
      }
    }

    let parsedDate = parse(dateStr, 'd MMMM yyyy', new Date());
    if (isValid(parsedDate)) {
      return parsedDate;
    }

    const formats = ['dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
    for (const format of formats) {
      parsedDate = parse(dateStr, format, new Date());
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    }

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

  const totalSteps = jsonData.length;
  
  const cleanedData = jsonData.map((row, index) => {
    if (index % 100 === 0) {
      self.postMessage({ type: 'progress', progress: Math.round((index / totalSteps) * 50) });
    }

    try {
      const newRow = { ...row };

      Object.keys(newRow).forEach((key) => {
        const trimmedKey = key.trim();
        if (trimmedKey !== key) {
          newRow[trimmedKey] = newRow[key];
          delete newRow[key];
        }

        if (typeof newRow[trimmedKey] === 'string') {
          newRow[trimmedKey] = newRow[trimmedKey].trim();
        }
      });

      newRow['Data de início da liquidação'] = convertDate(newRow['Data de início da liquidação']);

      const contasReceberStr = newRow['Contas a receber'] ? newRow['Contas a receber'].toString().replace('BRL ', '') : '0';
      const contasReceber = parseFloat(contasReceberStr.replace(/\./g, '').replace(',', '.')) || 0;
      newRow['Contas a receber'] = contasReceber / 100;

      return newRow;
    } catch (error) {
      return null;
    }
  }).filter(row => row !== null);

  const validData = cleanedData.filter((row) => row['Data de início da liquidação'] !== null);

  validData.sort((a, b) => {
    const dateA = a['Data de início da liquidação'];
    const dateB = b['Data de início da liquidação'];
    return dateA - dateB;
  });

  let filteredData = validData;
  if (startDate) {
    filteredData = validData.filter((row) => {
      const date = row['Data de início da liquidação'];
      return date && date >= startDate;
    });
  }

  filteredData.forEach((row) => {
    row['Renda Count'] = row['Contas a receber'] > 0 ? 1 : 0;
  });

  const groupedResultsWithCount = {};
  let previousDate = null;

  filteredData.forEach((row, index) => {
    if (index % 100 === 0) {
      self.postMessage({ type: 'progress', progress: 50 + Math.round((index / filteredData.length) * 25) });
    }

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

  const resultsArray = Object.keys(groupedResultsWithCount).map((key) => {
    const item = groupedResultsWithCount[key];
    item['Grouped Date'] = format(new Date(key), 'dd-MM-yyyy');
    return item;
  });

  resultsArray.forEach((item, index) => {
    if (index % 10 === 0) {
      self.postMessage({ type: 'progress', progress: 75 + Math.round((index / resultsArray.length) * 25) });
    }

    item['Montante Fixo'] = item['Renda'] - item['Despesa'];
    item['Percentual Despesa'] = item['Renda'] !== 0 ? (item['Despesa'] / item['Renda']) * 100 : 0;
    item['Recebimento médio por pedido'] = item['Renda Count'] !== 0 ? item['Montante Fixo'] / item['Renda Count'] : 0;
  });

  resultsArray.forEach((item) => {
    item['Renda'] = formatReal(item['Renda']);
    item['Despesa'] = formatReal(item['Despesa']);
    item['Montante Fixo'] = formatReal(item['Montante Fixo']);
    item['Recebimento médio por pedido'] = formatReal(item['Recebimento médio por pedido']);
    item['Percentual Despesa'] = item['Percentual Despesa'].toFixed(2) + '%';
  });

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
}