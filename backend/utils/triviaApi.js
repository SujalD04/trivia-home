// backend/utils/triviaApi.js
const axios = require('axios'); // npm install axios

const TRIVIA_API_BASE_URL = 'https://opentdb.com/api.php';
const TRIVIA_CATEGORY_URL = 'https://opentdb.com/api_category.php'; // New endpoint for categories

// Function to decode HTML entities in question/answer strings
const decodeHtmlEntities = (text) => {
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'",
        '&rsquo;': '’',
        '&ldquo;': '“',
        '&rdquo;': '”',
        // Add more as needed based on common API output
    };
    for (const entity in entities) {
        text = text.replace(new RegExp(entity, 'g'), entities[entity]);
    }
    return text;
};

// Function to shuffle an array (Fisher-Yates)
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

/**
 * Fetches trivia questions from OpenTDB.
 * @param {object} options - Configuration for the questions.
 * @param {number} options.amount - Number of questions to fetch.
 * @param {string|number} [options.category='any'] - Category ID(s) (e.g., 9 for General Knowledge, '9,10' for multiple) or 'any'.
 * @param {string} [options.difficulty='any'] - 'easy', 'medium', 'hard', or 'any'.
 * @param {string} [options.type='multiple'] - 'multiple', 'boolean', or 'any'.
 * @returns {Array} An array of formatted question objects.
 */
const fetchTriviaQuestions = async ({ amount = 10, category = 'any', difficulty = 'any', type = 'multiple' }) => {
    try {
        const params = {
            amount: amount,
        };

        // --- MODIFIED: Handle category parameter for single ID or comma-separated string ---
        // The OpenTDB API allows comma-separated category IDs.
        if (category !== 'any' && category !== null && category !== undefined && category !== '') {
            // If category is a string (could be '9' or '9,10,11') or a number (e.g., 9)
            // Axios will correctly append this as ?category=9 or ?category=9,10,11
            params.category = category;
        }

        if (difficulty !== 'any' && difficulty !== null && difficulty !== undefined && difficulty !== '') {
            params.difficulty = difficulty;
        }
        if (type !== 'any') { // 'any' is default and usually means no 'type' parameter
            params.type = type;
        }

        const response = await axios.get(TRIVIA_API_BASE_URL, { params });

        if (response.data.response_code !== 0) {
            console.warn(`Trivia API returned non-zero response code: ${response.data.response_code}`);
            if (response.data.response_code === 1) {
                console.warn('No results for the specified criteria. Trying a broader search.');
                // Attempt a broader search if no results found for specific criteria
                return await fetchTriviaQuestions({ amount: amount, category: 'any', difficulty: 'any', type: 'multiple' });
            }
            throw new Error(`Trivia API error: Code ${response.data.response_code}`);
        }

        const formattedQuestions = response.data.results.map(q => {
            const allOptions = [
                ...q.incorrect_answers.map(decodeHtmlEntities),
                decodeHtmlEntities(q.correct_answer)
            ];
            const shuffledOptions = q.type === 'multiple' ? shuffleArray(allOptions) : allOptions;

            return {
                questionText: decodeHtmlEntities(q.question),
                correctAnswer: decodeHtmlEntities(q.correct_answer),
                options: shuffledOptions,
                type: q.type,
                category: decodeHtmlEntities(q.category),
                difficulty: q.difficulty
            };
        });

        return formattedQuestions;

    } catch (error) {
        console.error('Error fetching trivia questions:', error.message);
        if (error.response) {
            console.error('API Response Data:', error.response.data);
            console.error('API Response Status:', error.response.status);
        }
        return [];
    }
};

/**
 * Fetches a list of available trivia categories from OpenTDB.
 * @returns {Array} An array of category objects, each with 'id' and 'name'.
 */
const fetchTriviaCategories = async () => {
    try {
        const response = await axios.get(TRIVIA_CATEGORY_URL);

        if (response.data && response.data.trivia_categories) {
            return response.data.trivia_categories.map(cat => ({
                id: cat.id,
                name: decodeHtmlEntities(cat.name)
            }));
        }
        console.warn('No trivia_categories found in response data or response.data is null/undefined.');
        return [];
    } catch (error) {
        console.error('Error fetching trivia categories from OpenTDB:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received from OpenTDB:', error.request);
        } else {
            console.error('Error setting up request to OpenTDB:', error.message);
        }
        return [];
    }
};

module.exports = { fetchTriviaQuestions, fetchTriviaCategories };