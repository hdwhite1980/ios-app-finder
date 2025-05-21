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
    const searchMoreContainer = document.getElementById('search-more-container');
    const searchMoreYesButton = document.getElementById('search-more-yes');
    const searchMoreNoButton = document.getElementById('search-more-no');
    const allResultsContainer = document.getElementById('all-results-container');
    const allResultsBody = document.getElementById('all-results-body');
    const allResultsCount = document.getElementById('all-results-count');
    const clearAllButton = document.getElementById('clear-all-results');
    
    // Store results for current search and all accumulated results
    let appResults = [];
    let allApps = [];
    
    // Search for apps
    async function searchApps() {
        const searchTerm = appNameInput.value.trim();
        
        if (!searchTerm) {
            showError('Please enter an app name');
            return;
        }
        
        // Clear current search results
        appResults = [];
        resultsBody.innerHTML = '';
        hideError();
        showLoading();
        hideResults();
        hideSearchMorePrompt();
        
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
            
            // Display current search results
            displayResults();
            showResults();
            hideLoading();
            
            // Show the "Search for more?" prompt
            showSearchMorePrompt();
            
        } catch (error) {
            console.error('Error:', error);
            showError(`Error fetching app data: ${error.message}`);
            hideLoading();
        }
    }
    
    // Add current results to all results
    function addToAllResults() {
        // Add current results to the accumulated results
        allApps = [...allApps, ...appResults];
        
        // Update the all results display
        updateAllResultsDisplay();
        
        // Show the all results container if it's not already visible
        showAllResultsContainer();
        
        // Clear the search input for the next search
        appNameInput.value = '';
        appNameInput.focus();
        
        // Hide the current results and the search more prompt
        hideResults();
        hideSearchMorePrompt();
    }
    
    // Finalize search and prepare for CSV download
    function finalizeSearch() {
        // Add current results to all results
        addToAllResults();
        
        // Scroll to the all results section
        allResultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Update the display of all accumulated results
    function updateAllResultsDisplay() {
        // Update the count
        allResultsCount.textContent = allApps.length;
        
        // Update the all results table
        allResultsBody.innerHTML = '';
        
        allApps.forEach((app, index) => {
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
            
            const actionCell = document.createElement('td');
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-button';
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', () => removeApp(index));
            actionCell.appendChild(removeButton);
            row.appendChild(actionCell);
            
            allResultsBody.appendChild(row);
        });
        
        // Show or hide the download button based on whether we have results
        if (allApps.length > 0) {
            downloadCsvButton.style.display = 'block';
        } else {
            downloadCsvButton.style.display = 'none';
            hideAllResultsContainer();
        }
    }
    
    // Remove an app from the accumulated results
    function removeApp(index) {
        allApps.splice(index, 1);
        updateAllResultsDisplay();
    }
    
    // Clear all accumulated results
    function clearAllResults() {
        if (confirm('Are you sure you want to clear all accumulated results?')) {
            allApps = [];
            updateAllResultsDisplay();
        }
    }
    
    // Display results in the current search results table
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
    
    // Generate and download CSV with all accumulated results
    function downloadCsv() {
        if (allApps.length === 0) {
            showError('No results to download');
            return;
        }
        
        // Create CSV header
        const headers = ['App Name', 'App Store URL', 'App Bundle ID', 'Publisher'];
        
        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...allApps.map(app => 
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
        const filename = `ios_app_info_collection_${new Date().toISOString().slice(0, 10)}.csv`;
        
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
    
    function showSearchMorePrompt() {
        searchMoreContainer.style.display = 'block';
    }
    
    function hideSearchMorePrompt() {
        searchMoreContainer.style.display = 'none';
    }
    
    function showAllResultsContainer() {
        allResultsContainer.style.display = 'block';
    }
    
    function hideAllResultsContainer() {
        allResultsContainer.style.display = 'none';
    }
    
    // Event listeners
    searchButton.addEventListener('click', searchApps);
    appNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchApps();
        }
    });
    downloadCsvButton.addEventListener('click', downloadCsv);
    clearAllButton.addEventListener('click', clearAllResults);
    
    // Search more prompt buttons
    searchMoreYesButton.addEventListener('click', addToAllResults);
    searchMoreNoButton.addEventListener('click', finalizeSearch);
});