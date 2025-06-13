/**
 * Results display functionality for election demo
 */

let previousResultsWithIphone = null;
let previousResultsWithoutIphone = null;
const recentVotes = [];

/**
 * Animates a number from start to end value
 * @param {HTMLElement} element - The element to update
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 */
function animateNumber(element, start, end) {
    const duration = 1000; // 1 second
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const current = Math.round(start + (end - start) * progress);
        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/**
 * Fetches the question text from the API
 * @param {string} elementSelector - CSS selector for the element to update with the question
 */
async function fetchQuestion(elementSelector = '.results-title') {
    try {
        const response = await fetch('/api/elections');
        const data = await response.json();
        const question = data['NDC 2025'].questions[0].question;
        console.log('Fetched question:', question);
        document.querySelector(elementSelector).textContent = question;
    } catch (error) {
        console.error('Error fetching question:', error);
    }
}

/**
 * Updates the results display with the provided data
 * @param {Object} resultsWithoutIphone - The results data from the API
 * @param {string} containerId - ID of the container element for results
 * @param {boolean} showRecentVotes - Whether to show recent votes section
 */
function updateResults(resultsWithoutIphone, resultsWithIphone, containerId = 'resultsGrid', showRecentVotes = true) {
    const totalVotes = Object.values(resultsWithoutIphone[0]).reduce((a, b) => a + b, 0);
    const totalVotesElement = document.getElementById('totalVotes');
    if (totalVotesElement) {
        totalVotesElement.textContent = totalVotes;
    }

    const resultsGrid = document.getElementById(containerId);
    if (!resultsGrid) return;
    
    const languages = Object.keys(resultsWithoutIphone[0]);

    languages.forEach(language => {
        const votes = resultsWithoutIphone[0][language];
        const percentage = ((votes / totalVotes) * 100).toFixed(1);
        
        const withIphoneTotalVotes = Object.values(resultsWithIphone[0]).reduce((a, b) => a + b, 0);
        const withIphoneVotes = resultsWithIphone[0][language];
        const withIphonePercentage = ((withIphoneVotes / withIphoneTotalVotes) * 100).toFixed(1);
        
        let resultItem = document.getElementById(`result-${language}`);
        
        if (!resultItem) {
            resultItem = document.createElement('div');
            resultItem.id = `result-${language}`;
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <div class="table-row">
                    <span class="language">${language}</span>
                    <div>
                        <div class="result-data without-iphone">
                            <span class="percentage without-iphone">-</span>&nbsp;<span class="votes without-iphone">-</span>
                        </div>
                        <div class="result-data with-iphone">
                            <span class="percentage with-iphone">-</span>&nbsp;<span class="votes with-iphone">-</span>
                        </div>
                    </div>
                </div>`;
            resultsGrid.appendChild(resultItem);
        }

        // Update without-iPhone values
        if (previousResultsWithoutIphone && previousResultsWithoutIphone[0][language] !== votes) {
            const votesElement = resultItem.querySelector('.votes.without-iphone');
            const previousVotes = previousResultsWithoutIphone[0][language] || 0;
            animateNumber(votesElement, previousVotes, votes);
            setTimeout(() => {
                votesElement.textContent = votes + " votes";
            }, 1000);
        } else {
            resultItem.querySelector('.votes.without-iphone').textContent = votes + " votes";
        }
        
        resultItem.querySelector('.percentage.without-iphone').textContent = `${percentage}%`;
        
        // Update with-iPhone values
        if (previousResultsWithIphone && previousResultsWithIphone[0][language] !== withIphoneVotes) {
            const votesElement = resultItem.querySelector('.votes.with-iphone');
            const previousVotes = previousResultsWithIphone[0][language] || 0;
            animateNumber(votesElement, previousVotes, withIphoneVotes);
            setTimeout(() => {
                votesElement.textContent = withIphoneVotes + " votes";
            }, 1000);
        } else {
            resultItem.querySelector('.votes.with-iphone').textContent = withIphoneVotes + " votes";
        }
        
        resultItem.querySelector('.percentage.with-iphone').textContent = `${withIphonePercentage}%`;
    });

    if (showRecentVotes && (!previousResultsWithIphone || 
        Object.values(resultsWithoutIphone[0]).reduce((a, b) => a + b, 0) > 
        Object.values(previousResultsWithIphone[0]).reduce((a, b) => a + b, 0))) {
        
        languages.forEach(language => {
            if (!previousResultsWithIphone || resultsWithoutIphone[0][language] > previousResultsWithIphone[0][language]) {
                recentVotes.unshift({
                    language,
                    timestamp: new Date()
                });
            }
        });

        while (recentVotes.length > 5) {
            recentVotes.pop();
        }

        randomAnon = function() {
            // Return "■■■■■■■ ■■■■■■■■", but with random length first and last name
            const min = 3; // Minimum name length
            const max = 10; // Maximum name length
          
            const getRandomLength = () => Math.floor(Math.random() * (max - min + 1)) + min;
          
            const generateBlockName = (length) => '■'.repeat(length);
          
            const firstName = generateBlockName(getRandomLength());
            const lastName = generateBlockName(getRandomLength());
          
            return `${firstName} ${lastName}`;
        }

        const recentVotesContainer = document.getElementById('recentVotes');
        if (recentVotesContainer) {
            recentVotesContainer.innerHTML = recentVotes.map(vote => `
                <div class="recent-vote">
                    Vote for ${randomAnon()} at ${vote.timestamp.toLocaleTimeString()}
                </div>
            `).join('');
        }
    }

    previousResultsWithoutIphone = resultsWithoutIphone;
    previousResultsWithIphone = resultsWithIphone;
}

/**
 * Fetches results from the API and updates the display
 * @param {string} containerId - ID of the container element for results
 * @param {boolean} showRecentVotes - Whether to show recent votes section
 * @param {Function} resultsModifier - Optional function to modify results before display
 * @param {boolean} showBothResults - Whether to show both with and without iPhone results
 * @param {string} excludeType - Type of exclusion to apply (e.g., 'iphone', 'telenor', 'norway')
 */
async function fetchResults(containerId = 'resultsGrid', showRecentVotes = true, resultsModifier = null, showBothResults = false, excludeType = null) {
    try {
        let apiUrl = '/api/results/NDC 2025';
        if (excludeType) {
            apiUrl += `?exclude=${excludeType}`;
        }
        
        const response = await fetch(apiUrl);
        let data = await response.json();
        
        // Update the total votes display
        const totalVotesElementWithout = document.getElementById('totalVotesIphone');
        if (totalVotesElementWithout) {
            totalVotesElementWithout.textContent = data.iphoneVotes || data.excludedVotes || 0;
        }

        const totalVotesElementWith = document.getElementById('totalVotesWithIphone');
        if (totalVotesElementWith) {
            totalVotesElementWith.textContent = data.totalVotes;
        }
        
        // Update excluded type display if element exists
        const excludeTypeElement = document.getElementById('excludeType');
        if (excludeTypeElement) {
            const excludeDisplayNames = {
                'iphone': 'iPhone users',
                'telenor': 'Telenor customers',
                'norway': 'Norwegian voters',
                'germany': 'German voters',
                'telia': 'Telia customers',
                'o2': 'O2 customers'
            };
            excludeTypeElement.textContent = excludeDisplayNames[data.excludeType] || 'None';
        }
        
        // New format with both withIphone and withoutIphone results
        let withoutIphoneResults = data.withoutIphone || data.withoutExcluded;
        let withIphoneResults = data.withIphone || data.withAll;
        
        // Apply custom modifications if provided
        if (resultsModifier && typeof resultsModifier === 'function') {
            // The modifier might expect the old format, so we pass withoutIphone by default
            withoutIphoneResults = resultsModifier(withoutIphoneResults);
            // We don't modify withIphoneResults
        }
        
        updateResults(withoutIphoneResults, withIphoneResults, containerId, showRecentVotes);
        
        // Return the winner (highest votes) from withIphoneResults or withoutIphoneResults based on showBothResults
        const resultsToUse = showBothResults ? withIphoneResults : withoutIphoneResults;
        if (resultsToUse && resultsToUse[0]) {
            const languages = Object.keys(resultsToUse[0]);
            const winner = languages.reduce((a, b) => resultsToUse[0][a] > resultsToUse[0][b] ? a : b);
            return winner;
        }
    } catch (error) {
        console.error('Error fetching results:', error);
    }
    return null;
}

/**
 * Initializes the results display with regular polling
 * @param {Object} options - Configuration options
 * @param {string} options.containerId - ID of the container element for results
 * @param {boolean} options.showRecentVotes - Whether to show recent votes section
 * @param {Function} options.resultsModifier - Optional function to modify results before display
 * @param {number} options.pollInterval - Polling interval in milliseconds
 * @param {Function} options.onWinnerDetermined - Callback when winner is determined
 * @param {boolean} options.showBothResults - Whether to show both with and without iPhone results
 * @param {string} options.excludeType - Type of exclusion to apply
 */
function initResultsDisplay(options = {}) {
    const {
        containerId = 'resultsGrid',
        showRecentVotes = true,
        resultsModifier = null,
        pollInterval = 1000,
        onWinnerDetermined = null,
        questionSelector = '.results-title',
        showBothResults = false,
        excludeType = null
    } = options;
    
    if (questionSelector) {
        fetchQuestion(questionSelector);
    }
    
    // Initial fetch
    fetchResults(containerId, showRecentVotes, resultsModifier, showBothResults, excludeType).then(winner => {
        if (onWinnerDetermined && winner) {
            onWinnerDetermined(winner);
        }
    });
    
    // Set up polling
    if (pollInterval > 0) {
        setInterval(() => {
            fetchResults(containerId, showRecentVotes, resultsModifier, showBothResults, excludeType).then(winner => {
                if (onWinnerDetermined && winner) {
                    onWinnerDetermined(winner);
                }
            });
        }, pollInterval);
    }
}
