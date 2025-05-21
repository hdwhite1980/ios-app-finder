// public/app.js
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const appNameInput = document.getElementById('app-name');
    const searchButton = document.getElementById('search-button');
    const errorMessage = document.getElementById('error-message');
    const loading = document.getElementById('loading');
    const resultsContainer = document.getElementById('results-container');
    const resultsBody = document.getElementById('results-body');
    const downloadCsvButton = document.getElementById('download-csv');
    
    // Store results for CSV export
    let appResults = [];
    
    // Search for apps
    async function searchApps() {
        const searchTerm = appNameInput.value.trim();
        
        if (!searchTerm) {
            showError('Please enter an app name');
            return;
        }
        
        // Clear previous results
        appResults = [];
        resultsBody.innerHTML = '';
        hideError();
        showLoading();
        hideResults();
        
        try {
            // Use our backend API endpoint that proxies to iTunes
            const response = await fetch(`/api/search?term=${encodeURIComponent(searchTerm)}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.resultCount === 0) {
                showError('No apps found matching that name');
                hideLoading();
                return;
            }
            
            // Process results
            appResults = data.results.map(app => ({
                appName: app.trackName || 'Unknown',
                appStoreUrl: app.trackViewUrl || '',
                bundleId: app.bundleId || 'Unknown',
                publisher: app.sellerName || 'Unknown'
            }));
            
            // Display results
            displayResults();
            showResults();
            hideLoading();
            
        } catch (error) {
            console.error('Error:', error);
            showError(`Error fetching app data: ${error.message}`);
            hideLoading();
        }
    }
    
    // Display results in the table
    function displayResults() {
        resultsBody.innerHTML = '';
        
        appResults.forEach(app => {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.textContent = app.appName;
            row.appendChild(nameCell);
            
            const urlCell = document.createElement('td');
            const urlLink = document.createElement('a');
            urlLink.href = app.appStoreUrl;
            urlLink.target = '_blank';
            urlLink.className = 'truncate';
            urlLink.textContent = app.appStoreUrl;
            urlCell.appendChild(urlLink);
            row.appendChild(urlCell);
            
            const bundleCell = document.createElement('td');
            bundleCell.textContent = app.bundleId;
            row.appendChild(bundleCell);
            
            const publisherCell = document.createElement('td');
            publisherCell.textContent = app.publisher;
            row.appendChild(publisherCell);
            
            resultsBody.appendChild(row);
        });
    }
    
    // Generate and download CSV
    function downloadCsv() {
        if (appResults.length === 0) {
            showError('No results to download');
            return;
        }
        
        // Create CSV header
        const headers = ['App Name', 'App Store URL', 'App Bundle ID', 'Publisher'];
        
        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...appResults.map(app => 
                [
                    `"${escapeCSV(app.appName)}"`,
                    `"${escapeCSV(app.appStoreUrl)}"`,
                    `"${escapeCSV(app.bundleId)}"`,
                    `"${escapeCSV(app.publisher)}"`
                ].join(',')
            )
        ].join('\n');
        
        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = `ios_app_info_${appNameInput.value.replace(/\s+/g, '_')}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Helper function to escape quotes in CSV
    function escapeCSV(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/"/g, '""');
    }
    
    // UI Helper functions
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    function hideError() {
        errorMessage.style.display = 'none';
    }
    
    function showLoading() {
        loading.style.display = 'block';
        searchButton.disabled = true;
    }
    
    function hideLoading() {
        loading.style.display = 'none';
        searchButton.disabled = false;
    }
    
    function showResults() {
        resultsContainer.style.display = 'block';
    }
    
    function hideResults() {
        resultsContainer.style.display = 'none';
    }
    
    // Event listeners
    searchButton.addEventListener('click', searchApps);
    appNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchApps();
        }
    });
    downloadCsvButton.addEventListener('click', downloadCsv);
});