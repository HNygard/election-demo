/**
 * Results display functionality for election demo
 */

let previousResults = null;
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
 * @param {Object} results - The results data from the API
 * @param {string} containerId - ID of the container element for results
 * @param {boolean} showRecentVotes - Whether to show recent votes section
 */
function updateResults(results, containerId = 'resultsGrid', showRecentVotes = true) {
    const totalVotes = Object.values(results[0]).reduce((a, b) => a + b, 0);
    const totalVotesElement = document.getElementById('totalVotes');
    if (totalVotesElement) {
        totalVotesElement.textContent = totalVotes;
    }

    const resultsGrid = document.getElementById(containerId);
    if (!resultsGrid) return;
    
    const languages = Object.keys(results[0]);

    languages.forEach(language => {
        const votes = results[0][language];
        const percentage = ((votes / totalVotes) * 100).toFixed(1);
        
        let resultItem = document.getElementById(`result-${language}`);
        
        if (!resultItem) {
            resultItem = document.createElement('div');
            resultItem.id = `result-${language}`;
            resultItem.className = 'result-item';
            resultItem.innerHTML = `<div class="table-row"><span class="language">${language}</span> <span class="percentage">-</span>,&nbsp;<span class="votes">-</span></div>`;
            resultsGrid.appendChild(resultItem);
        }

        if (previousResults && previousResults[0][language] !== votes) {
            const votesElement = resultItem.querySelector('.votes');
            const previousVotes = previousResults[0][language];
            animateNumber(votesElement, previousVotes, votes);
            setTimeout(() => {
                votesElement.textContent = votes + " votes";
            }, 1000);
        } else {
            resultItem.querySelector('.votes').textContent = votes + " votes";
        }
        
        resultItem.querySelector('.percentage').textContent = `${percentage}%`;
    });

    if (showRecentVotes && (!previousResults || 
        Object.values(results[0]).reduce((a, b) => a + b, 0) > 
        Object.values(previousResults[0]).reduce((a, b) => a + b, 0))) {
        
        languages.forEach(language => {
            if (!previousResults || results[0][language] > previousResults[0][language]) {
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

    previousResults = results;
}

/**
 * Fetches results from the API and updates the display
 * @param {string} containerId - ID of the container element for results
 * @param {boolean} showRecentVotes - Whether to show recent votes section
 * @param {Function} resultsModifier - Optional function to modify results before display
 */
async function fetchResults(containerId = 'resultsGrid', showRecentVotes = true, resultsModifier = null) {
    try {
        const response = await fetch('/api/results/NDC 2025');
        let results = await response.json();
        
        // Apply custom modifications to results if provided
        if (resultsModifier && typeof resultsModifier === 'function') {
            results = resultsModifier(results);
        }
        
        updateResults(results, containerId, showRecentVotes);
        
        // Return the winner (highest votes)
        if (results && results[0]) {
            const languages = Object.keys(results[0]);
            const winner = languages.reduce((a, b) => results[0][a] > results[0][b] ? a : b);
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
 */
function initResultsDisplay(options = {}) {
    const {
        containerId = 'resultsGrid',
        showRecentVotes = true,
        resultsModifier = null,
        pollInterval = 1000,
        onWinnerDetermined = null,
        questionSelector = '.results-title'
    } = options;
    
    if (questionSelector) {
        fetchQuestion(questionSelector);
    }
    
    // Initial fetch
    fetchResults(containerId, showRecentVotes, resultsModifier).then(winner => {
        if (onWinnerDetermined && winner) {
            onWinnerDetermined(winner);
        }
    });
    
    // Set up polling
    if (pollInterval > 0) {
        setInterval(() => {
            fetchResults(containerId, showRecentVotes, resultsModifier).then(winner => {
                if (onWinnerDetermined && winner) {
                    onWinnerDetermined(winner);
                }
            });
        }, pollInterval);
    }
}
