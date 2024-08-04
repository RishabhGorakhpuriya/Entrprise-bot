const axios = require('axios');
const fetch = require('node-fetch');
const cheerio = require('cheerio'); 

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID= process.env.TELEGRAM_CHAT_ID
console.log(TELEGRAM_BOT_TOKEN);

const getRandomItem = (array) => {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
};

const generateCategories = () => {
    return [
        'Music', 'Technology', 'Sports', 'Politics', 'Science',
        'Health', 'Entertainment', 'Business', 'Travel', 'Education',
        'Art', 'Fashion', 'Food', 'History', 'Literature',
        'Gaming', 'Lifestyle', 'Movies', 'Television', 'Theater',
        'Nature'
    ];
};

const fetchList = async (category) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${category.replace(/[" "]/g, '_')}&cmprop=title|type&format=json&cmlimit=500&cmtype=page|subcat&origin=*`;
    const fetchedData = { articles: [], subCats: [] };
    const response = await fetch(url);

    if (!response.ok) {
        const message = `An error has occurred: ${response.status}`;
        throw new Error(message);
    } else {
        const { query: { categorymembers } } = await response.json();
        var count = 0
        for (const element of categorymembers) {
            
            if (element.type === 'page') {
                fetchedData.articles.push(element.title.replace(/[" "]/g, '_'));
            } else {
                fetchedData.subCats.push(element.title.replace(/Category:/g, '').replace(/[" "]/g, '_'));
            }
            break;
        }
        return fetchedData;
    }
};

const fetchArticlesDetails = async (category) => {
    try {
        const { articles } = await fetchList(category);
        if (articles.length === 0) {
            throw new Error('No articles found in the specified category.');
        }

        // Fetch details of all articles
        const articleDetailsPromises = articles.map(title =>
            axios.get('https://en.wikipedia.org/w/api.php', {
                params: {
                    action: 'query',
                    format: 'json',
                    titles: title,
                    prop: 'extracts',
                    exintro: true,
                    origin: '*',
                }
            })
        );

        const responses = await Promise.all(articleDetailsPromises);

        // Compile all article details into a single message
        let message = 'Here are the articles from the wikipedia sent by node.js application:\n\n';
        responses.forEach(response => {
            const page = response.data.query.pages[Object.keys(response.data.query.pages)[0]];
            // Clean up the extract content by removing HTML tags
            const cleanExtract = cheerio.load(page.extract)('body').text();
            message += `*${page.title}*\n\n${cleanExtract}\n\n`;
        });

        return message;

    } catch (error) {
        console.error('Error fetching data from Wikipedia:', error);
        return null;
    }
};

// Function to post a message to Telegram
const postToTelegram = async (message) => {
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const result = await response.json();
        if (!result.ok) {
            throw new Error(result.description);
        }

        console.log('Message posted successfully');
    } catch (error) {
        console.error('Error posting message to Telegram:', error);
    }
};

// Main function to fetch articles, format the data, and post to Telegram
const main = async () => {
    const categories = generateCategories();
    const randomCategory = getRandomItem(categories);
    console.log(`Selected category: ${randomCategory}`);

    const message = await fetchArticlesDetails(randomCategory);
    console.log(message)
    if (message) {
        await postToTelegram(message);
    }
};

main();
