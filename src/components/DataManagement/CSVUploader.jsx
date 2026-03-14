import { useState, useCallback, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { uploadOrders, getSKUs } from '../../services/api';
import sampleOrdersRaw from '../../data/sample_orders.csv?raw';

const REQUIRED_COLUMNS = ['bill_no', 'date', 'store_id', 'cat_id', 'sku_id', 'units_sold'];

function validateRow(row, index, validSkuIds, validCatIds) {
  const errors = [];

  REQUIRED_COLUMNS.forEach((col) => {
    if (!row[col] || String(row[col]).trim() === '') {
      errors.push(`Missing "${col}"`);
    }
  });

  if (row.sku_id && validSkuIds.size > 0 && !validSkuIds.has(row.sku_id.trim())) {
    errors.push(`Unknown sku_id "${row.sku_id}"`);
  }

  if (row.cat_id && validCatIds.size > 0 && !validCatIds.has(row.cat_id.trim())) {
    errors.push(`Unknown cat_id "${row.cat_id}"`);
  }

  if (row.date && !/^\d{4}-\d{2}-\d{2}$/.test(row.date.trim())) {
    errors.push(`Invalid date format "${row.date}" (expected YYYY-MM-DD)`);
  }

  if (row.units_sold !== undefined && row.units_sold !== '') {
    const units = Number(row.units_sold);
    if (isNaN(units) || units < 1 || !Number.isInteger(units)) {
      errors.push(`Invalid units_sold "${row.units_sold}" (must be a positive integer)`);
    }
  }

  return errors.length > 0 ? { row: index + 1, errors } : null;
}

export default function CSVUploader({ storeId, onUploadSuccess }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [parseError, setParseError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const [validSkuIds, setValidSkuIds] = useState(new Set());
  const [validCatIds, setValidCatIds] = useState(new Set());

  useEffect(() => {
    getSKUs()
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setValidSkuIds(new Set(list.map(s => s.sku_id)));
        setValidCatIds(new Set(list.map(s => s.cat_id)));
      })
      .catch(() => {});
  }, []);

  const resetState = useCallback(() => {
    setParsedData(null);
    setCsvText('');
    setFileName('');
    setValidationErrors([]);
    setParseError('');
    setUploadResult(null);
    setUploadError('');
  }, []);

  const processFile = useCallback((file) => {
    resetState();

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please upload a .csv file.');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setCsvText(text);

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            const errorMessages = results.errors
              .slice(0, 5)
              .map((err) => `Row ${err.row !== undefined ? err.row + 1 : '?'}: ${err.message}`)
              .join('; ');
            setParseError(`CSV parsing errors: ${errorMessages}`);
            return;
          }

          const columns = results.meta.fields || [];
          const missingCols = REQUIRED_COLUMNS.filter((col) => !columns.includes(col));
          if (missingCols.length > 0) {
            setParseError(`Missing required columns: ${missingCols.join(', ')}`);
            return;
          }

          const data = results.data;
          setParsedData(data);

          const errors = data
            .map((row, idx) => validateRow(row, idx, validSkuIds, validCatIds))
            .filter(Boolean);
          setValidationErrors(errors);
        },
        error: (error) => {
          setParseError(`Failed to parse CSV: ${error.message}`);
        },
      });
    };
    reader.onerror = () => {
      setParseError('Failed to read file.');
    };
    reader.readAsText(file);
  }, [resetState]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    processFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFile]);

  const handleDownloadSample = useCallback(() => {
    const blob = new Blob([sampleOrdersRaw], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_orders.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!csvText || !fileName) return;

    setUploading(true);
    setUploadError('');
    setUploadResult(null);

    try {
      const response = await uploadOrders(storeId, csvText, fileName);
      const result = response.data;
      setUploadResult(result);
      setParsedData(null);
      setCsvText('');
      setFileName('');
      setValidationErrors([]);
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Upload failed. Please try again.';
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  }, [csvText, fileName, storeId, onUploadSuccess]);

  const hasValidationErrors = validationErrors.length > 0;
  const previewRows = parsedData ? parsedData.slice(0, 10) : [];
  const columns = parsedData && parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

  return (
    <div className="space-y-4">
      {/* Download Sample */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleDownloadSample}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download Sample CSV
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="mt-2 text-sm font-medium text-gray-700">
          {isDragOver ? 'Drop CSV file here' : 'Drag & drop a CSV file, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Required columns: {REQUIRED_COLUMNS.join(', ')}
        </p>
        {fileName && (
          <p className="mt-2 text-sm font-semibold text-blue-600">{fileName}</p>
        )}
      </div>

      {/* Parse Error */}
      {parseError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{parseError}</p>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {hasValidationErrors && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">
            Validation Warnings ({validationErrors.length} row{validationErrors.length !== 1 ? 's' : ''})
          </h4>
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {validationErrors.map((ve, idx) => (
              <li key={idx} className="text-sm text-amber-700">
                <span className="font-medium">Row {ve.row}:</span> {ve.errors.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Table */}
      {parsedData && previewRows.length > 0 && (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700">
              Preview (first {previewRows.length} of {parsedData.length} rows)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewRows.map((row, idx) => {
                  const rowErr = validationErrors.find((ve) => ve.row === idx + 1);
                  return (
                    <tr key={idx} className={rowErr ? 'bg-amber-50' : ''}>
                      <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">{idx + 1}</td>
                      {columns.map((col) => (
                        <td key={col} className="px-3 py-1.5 text-gray-900 whitespace-nowrap">
                          {row[col] ?? ''}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {parsedData && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {parsedData.length} row{parsedData.length !== 1 ? 's' : ''} parsed
            {hasValidationErrors && (
              <span className="text-amber-600 ml-1">
                ({validationErrors.length} with warnings)
              </span>
            )}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetState}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload Orders'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Upload Success */}
      {uploadResult && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Upload successful!</p>
              <p className="mt-1 text-sm text-green-700">
                {uploadResult.rows_inserted ?? 0} rows inserted
                {(uploadResult.rows_rejected ?? 0) > 0 && (
                  <span className="text-amber-700 ml-1">
                    / {uploadResult.rows_rejected} rows rejected
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
