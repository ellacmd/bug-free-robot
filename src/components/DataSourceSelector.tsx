import React, { useState } from 'react';
import {
    DataSource,
    APIDataOptions,
    CSVDataOptions,
    SyntheticDataOptions,
} from '../services/DataGenerationService';
import './DataSourceSelector.css';
import { Dice5, Globe, FileText } from 'lucide-react';

interface DataSourceSelectorProps {
    selectedSource: DataSource;
    onSourceChange: (source: DataSource) => void;
    onLoadData: (
        source: DataSource,
        options: APIDataOptions | CSVDataOptions | SyntheticDataOptions
    ) => void;
    isLoading: boolean;
}

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
    selectedSource,
    onSourceChange,
    onLoadData,
    isLoading,
}) => {
    const [apiEndpoint, setApiEndpoint] = useState(
        'https://randomuser.me/api/'
    );
    const [apiUserCount, setApiUserCount] = useState(5000);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [syntheticCount, setSyntheticCount] = useState(100000);
    const [csvDelimiter, setCsvDelimiter] = useState(',');
    const [csvHasHeader, setCsvHasHeader] = useState(true);

    const handleSourceChange = (source: DataSource) => {
        onSourceChange(source);
    };

    const handleLoadData = () => {
        let options: APIDataOptions | CSVDataOptions | SyntheticDataOptions;

        switch (selectedSource) {
            case 'api':
                options = {
                    endpoint: apiEndpoint,
                    method: 'GET',
                    headers: {},
                    userCount: apiUserCount,
                };
                break;
            case 'csv':
                if (!csvFile) {
                    alert('Please select a CSV file');
                    return;
                }
                options = {
                    file: csvFile,
                    delimiter: csvDelimiter,
                    hasHeader: csvHasHeader,
                };
                break;
            case 'synthetic':
                options = {
                    count: syntheticCount,
                };
                break;
        }

        onLoadData(selectedSource, options);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'text/csv') {
            setCsvFile(file);
        } else {
            alert('Please select a valid CSV file');
        }
    };

    return (
        <div className='data-source-selector'>
            <h3>Data Source Configuration</h3>

            <div className='source-tabs'>
                <button
                    className={`tab ${
                        selectedSource === 'synthetic' ? 'active' : ''
                    }`}
                    onClick={() => handleSourceChange('synthetic')}
                    disabled={isLoading}>
                    <Dice5 size={16} /> Synthetic Data
                </button>
                <button
                    className={`tab ${
                        selectedSource === 'api' ? 'active' : ''
                    }`}
                    onClick={() => handleSourceChange('api')}
                    disabled={isLoading}>
                    <Globe size={16} /> API Data
                </button>
                <button
                    className={`tab ${
                        selectedSource === 'csv' ? 'active' : ''
                    }`}
                    onClick={() => handleSourceChange('csv')}
                    disabled={isLoading}>
                    <FileText size={16} /> CSV Upload
                </button>
            </div>

            <div className='source-config'>
                {selectedSource === 'synthetic' && (
                    <div className='config-section'>
                        <label htmlFor='synthetic-count'>
                            Number of rows to generate:
                        </label>
                        <input
                            id='synthetic-count'
                            type='number'
                            value={syntheticCount}
                            onChange={(e) =>
                                setSyntheticCount(parseInt(e.target.value))
                            }
                            min='1000'
                            max='1000000'
                            step='1000'
                            disabled={isLoading}
                        />
                        <small>
                            Recommended: 10,000 - 100,000 for optimal
                            performance
                        </small>
                    </div>
                )}

                {selectedSource === 'api' && (
                    <div className='config-section'>
                        <label htmlFor='api-endpoint'>API Endpoint URL:</label>
                        <input
                            id='api-endpoint'
                            type='url'
                            value={apiEndpoint}
                            onChange={(e) => setApiEndpoint(e.target.value)}
                            placeholder='https://api.example.com/users'
                            disabled={isLoading}
                        />
                        <small>
                            Expected JSON format: Array of objects or{' '}
                            {'{data: [...]}'}
                        </small>

                        <label htmlFor='api-user-count'>
                            Number of users to fetch:
                        </label>
                        <input
                            id='api-user-count'
                            type='number'
                            value={apiUserCount}
                            onChange={(e) =>
                                setApiUserCount(parseInt(e.target.value))
                            }
                            min='100'
                            max='5000'
                            disabled={isLoading}
                        />
                        <small>
                            Note: The API will fetch between 100 to 5000 users.
                            For more users, the service worker will generate
                            additional synthetic data.
                        </small>

                        <div className='api-examples'>
                            <h4>API Data:</h4>
                            <p>
                                The Random User Generator provides realistic
                                test data for development and testing.
                            </p>
                        </div>
                    </div>
                )}

                {selectedSource === 'csv' && (
                    <div className='config-section'>
                        <label htmlFor='csv-file'>Select CSV File:</label>
                        <input
                            id='csv-file'
                            type='file'
                            accept='.csv'
                            onChange={handleFileChange}
                            disabled={isLoading}
                        />
                        {csvFile && (
                            <div className='file-info'>
                                <p>
                                    Selected: {csvFile.name} (
                                    {(csvFile.size / 1024 / 1024).toFixed(2)}{' '}
                                    MB)
                                </p>
                            </div>
                        )}

                        <div className='csv-options'>
                            <label htmlFor='csv-delimiter'>Delimiter:</label>
                            <select
                                id='csv-delimiter'
                                value={csvDelimiter}
                                onChange={(e) =>
                                    setCsvDelimiter(e.target.value)
                                }
                                disabled={isLoading}>
                                <option value=','>Comma (,)</option>
                                <option value=';'>Semicolon (;)</option>
                                <option value='\t'>Tab</option>
                                <option value='|'>Pipe (|)</option>
                            </select>

                            <label className='checkbox-label'>
                                <input
                                    type='checkbox'
                                    checked={csvHasHeader}
                                    onChange={(e) =>
                                        setCsvHasHeader(e.target.checked)
                                    }
                                    disabled={isLoading}
                                />
                                File has header row
                            </label>
                        </div>

                        <div className='csv-format'>
                            <h4>Expected CSV Format:</h4>
                            <pre>
                                {`id,name,email,role,status,department,score,joinDate,lastLogin
1,John Doe,john@example.com,admin,active,Engineering,85,2023-01-15,2024-01-10
2,Jane Smith,jane@example.com,user,active,Marketing,92,2023-02-20,2024-01-09`}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            <button
                className='load-data-btn'
                onClick={handleLoadData}
                disabled={isLoading || (selectedSource === 'csv' && !csvFile)}>
                {isLoading
                    ? 'Loading...'
                    : `Load ${selectedSource.toUpperCase()} Data`}
            </button>
        </div>
    );
};
