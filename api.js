// api.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const https = require('https');
const cheerio = require('cheerio');
const { ProxyAgent } = require('proxy-agent');

const app = express();
const port = 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Middleware to log client IP for each request
app.use((req, res, next) => {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`[${new Date().toISOString()}] Request from IP: ${clientIp}, Method: ${req.method}, URL: ${req.url}`);
    next();
});
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
];
const proxies = [
    'http://3.142.237.56:49205',
    'http://94.130.173.18:8080',
    'http://130.61.120.213:8888',
    'http://80.14.162.49:80',
    'http://83.68.136.236:80',
    'http://35.188.144.109:80'
];

function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function getRandomProxy() {
    return proxies[Math.floor(Math.random() * proxies.length)];
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const specialCharMap = {
    'Bucuresti': 'București',
    'Iasi': 'Iași',
    'Cluj': 'Cluj',
    'Timis': 'Timiș',
    'Constanta': 'Constanța',
    'Brasov': 'Brașov',
    'Prahova': 'Prahova',
    'Galati': 'Galați',
    'Suceava': 'Suceava',
    'Dambovita': 'Dâmbovița',
    'Mures': 'Mureș',
    'Dolj': 'Dolj',
    'Arges': 'Argeș',
    'Bacau': 'Bacău',
    'Bihor': 'Bihor',
    'Sibiu': 'Sibiu',
    'Teleorman': 'Teleorman',
    'Olt': 'Olt',
    'Valcea': 'Vâlcea',
    'Buzau': 'Buzău',
    'Caras-Severin': 'Caraș-Severin',
    'Hunedoara': 'Hunedoara',
    'Vaslui': 'Vaslui',
    'Botosani': 'Botoșani',
    'Alba': 'Alba',
    'Gorj': 'Gorj',
    'Satu Mare': 'Satu Mare',
    'Neamt': 'Neamț',
    'Harghita': 'Harghita',
    'Braila': 'Brăila',
    'Vrancea': 'Vrancea',
    'Ialomita': 'Ialomița',
    'Mehedinti': 'Mehedinți',
    'Covasna': 'Covasna',
    'Calarasi': 'Călărași',
    'Giurgiu': 'Giurgiu',
    'Maramures': 'Maramureș',
    'Bistrita-Nasaud': 'Bistrița-Năsăud',
    'Arad': 'Arad',
    'Salaj': 'Sălaj',
    'Tulcea': 'Tulcea'
};

async function fetchWithRetry(url, options, maxRetries = 3, baseDelay = 2000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const proxy = getRandomProxy();
            console.log(`Attempt ${i + 1}: Fetching URL: ${url}`);
            console.log(`Using proxy: ${proxy}`);

            const proxyAgent = new ProxyAgent(proxy);

            const response = await axios({
                ...options,
                url,
                headers: {
                    ...options.headers,
                    'User-Agent': getRandomUserAgent()
                },
                httpsAgent: proxyAgent,
                httpAgent: proxyAgent,
                proxy: false, // Disable axios's built-in proxy handling
                validateStatus: function (status) {
                    return status >= 200 && status < 300; // Default
                },
                timeout: 30000 // 30 seconds timeout
            });

            console.log(`Attempt ${i + 1}: Success`);
            return response;
        } catch (error) {
            console.error(`Attempt ${i + 1}: Request failed:`, error.message);
            if (error.response) {
                console.error('Error response status:', error.response.status);
                console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
            } else if (error.request) {
                console.error('No response received. Error request:', error.request);
            } else {
                console.error('Error details:', error);
            }

            if (i === maxRetries - 1) throw error;
            const delayTime = baseDelay * Math.pow(2, i);
            console.log(`Retrying in ${delayTime}ms...`);
            await delay(delayTime);
        }
    }
}



const removeDiacritics = require('diacritics').remove;

async function fetchOlxListings(params) {
    const baseUrl = 'https://www.olx.ro/api/v1/offers/';
    const searchParams = new URLSearchParams(params);
    searchParams.set('category_id', '907');
    searchParams.set('limit', '50');

    const county = searchParams.get('county');
    const city = searchParams.get('city');
    console.log('Searching for county:', county, 'and city:', city);

    const countyMap = {
        'bucuresti': { region_id: '46', city_id: '1' },
        // Add more county mappings as needed
    };

    const { region_id, city_id } = countyMap[removeDiacritics(county).toLowerCase()] || {};

    if (region_id && city_id) {
        searchParams.set('region_id', region_id);
        searchParams.set('city_id', city_id);
    }

    let allListings = [];
    let offset = 0;
    const maxListings = 200; // Maximum number of filtered listings to fetch
    const uniqueUrls = new Set(); // Set to store unique URLs

    while (allListings.length < maxListings && offset < 500) {
        searchParams.set('offset', offset.toString());
        console.log(`Fetching OLX listings with offset: ${offset}`);

        try {
            const response = await fetchWithRetry(`${baseUrl}?${searchParams.toString()}`, {
                method: 'GET'
            });

            if (!response.data || !Array.isArray(response.data.data)) {
                console.error('Unexpected response structure from OLX API');
                console.log('Response data:', JSON.stringify(response.data, null, 2));
                break;
            }

            const listings = response.data.data;
            if (listings.length === 0) {
                break;
            }

            console.log(`Number of listings fetched: ${listings.length}`);

            const filteredListings = listings.filter(listing => {
                const listingRegion = listing.location?.region?.name;
                const listingCity = listing.location?.city?.name;
                
                const normalizedListingRegion = removeDiacritics(listingRegion || '').toLowerCase();
                const normalizedCounty = removeDiacritics(county).toLowerCase();
                const normalizedListingCity = removeDiacritics(listingCity || '').toLowerCase();
                const normalizedCity = removeDiacritics(city || '').toLowerCase();

                const isCorrectRegion = normalizedListingRegion.includes(normalizedCounty) ||
                    (normalizedCounty === 'bucuresti' && normalizedListingRegion.includes('bucuresti - ilfov'));
                
                const isCorrectCity = !city || normalizedListingCity.includes(normalizedCity);
                
                return isCorrectRegion && isCorrectCity && !uniqueUrls.has(listing.url);
            });

            const processedListings = filteredListings.map(listing => ({
                _id: `olx_${listing.id}`,
                title: listing.title || 'N/A',
                price: listing.params.find(p => p.key === 'price')?.value?.value || 'N/A',
                currency: listing.params.find(p => p.key === 'price')?.value?.currency || 'RON',
                surfaceBuilt: listing.params.find(p => p.key === 'm')?.value?.key || 'N/A',
                address: listing.location?.city?.name || 'N/A',
                description: listing.description || 'N/A',
                url: listing.url || 'N/A',
                county: listing.location?.region?.name || 'N/A'
            }));

            allListings = [...allListings, ...processedListings];
            console.log(`Total OLX listings fetched: ${allListings.length}`);
    
            if (allListings.length >= maxListings) {
                console.log(`Reached maximum number of listings (${maxListings}). Stopping fetch.`);
                break;
            }

            if (listings.length < 50) {
                break; // No more results to fetch
            }

            offset += 50;
            await delay(2000); // Wait 2 seconds before the next batch
        } catch (error) {
            console.error('Error fetching OLX listings:', error.message);
            if (error.response) {
                console.error('Error response status:', error.response.status);
                console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
            }
            break; // Exit the loop if an error occurs
        }
    }

    return allListings.slice(0, maxListings);
}

function removeDuplicates(listings) {
    const uniqueListings = [];
    const urlSet = new Set();

    for (const listing of listings) {
        if (!urlSet.has(listing.url)) {
            urlSet.add(listing.url);
            uniqueListings.push(listing);
        }
    }

    return uniqueListings;
}


function extractSurfaceFromParams(params) {
    const surfaceParam = params.find(param => 
        param.key === 'surface' || 
        param.name === 'Suprafata utila' || 
        param.name === 'Suprafață utilă'
    );
    return surfaceParam ? surfaceParam.value.key || surfaceParam.value : null;
}

function extractAddressFromParams(params) {
    const addressParam = params.find(param => param.key === 'address' || param.name === 'Adresa');
    return addressParam ? addressParam.value : null;
}

function extractSurfaceFromHtml(html) {
    const $ = cheerio.load(html);
    const surfaceText = $('th:contains("Suprafaţă utilă"), th:contains("Suprafață utilă")').next().text();
    const surfaceMatch = surfaceText.match(/(\d+) m²/);
    return surfaceMatch ? surfaceMatch[1] : 'N/A';
}

function extractAddressFromHtml(html) {
    const $ = cheerio.load(html);
    return $('th:contains("Adresa:")').next().text().trim() || 'N/A';
}




async function fetchTrimbitasuListings(params) {
    const baseUrl = 'https://www.trimbitasu.ro/api/public/listings';
    const searchParams = new URLSearchParams(params);
    
    let allListings = [];
    let currentPage = 1;
    let hasNext = true;

    while (hasNext) {
        searchParams.set('page', currentPage.toString());
        try {
            const response = await axios.get(`${baseUrl}?${searchParams}`);
            const data = response.data;

            if (Array.isArray(data.pages)) {
                allListings = allListings.concat(data.pages.map(listing => ({
                    _id: `trimbitasu_${listing.id}`,
                    title: listing.title,
                    price: listing.price,
                    currency: listing.currency,
                    surfaceBuilt: listing.surfaceBuilt,
                    address: listing.address,
                    description: listing.description,
                    url: `https://www.trimbitasu.ro/visitor/listings/${listing.id}`
                })));
            }

            hasNext = data.pageParams.hasNext;
            currentPage++;
        } catch (error) {
            console.error('Error fetching Trimbitasu page:', error.message);
            break;
        }
    }

    console.log('Total Trimbitasu listings fetched:', allListings.length);
    return allListings;
}





async function fetchAllPages(baseUrl, params) {
    let allListings = [];
    let currentPage = 1;
    let hasNext = true;

    while (hasNext) {
        params.set('page', currentPage.toString());
        const url = `${baseUrl}?${params.toString()}`;
        const response = await axios.get(url);
        const data = response.data;

        if (Array.isArray(data.pages)) {
            allListings = allListings.concat(data.pages);
        }

        hasNext = data.pageParams.hasNext;
        currentPage++;
    }

    return allListings;
}

app.get('/api/listings', async (req, res) => {
    try {
        const params = new URLSearchParams(req.query);
        
        // Fetch Trimbitasu listings
        const trimbitasuListings = await fetchTrimbitasuListings(params);
        console.log('Trimbitasu listings fetched:', trimbitasuListings.length);

        // Fetch OLX listings
        let olxListings = await fetchOlxListings(params);
        console.log('OLX listings fetched (before deduplication):', olxListings.length);

        // Remove duplicates from OLX listings
        olxListings = removeDuplicates(olxListings);
        console.log('OLX listings after deduplication:', olxListings.length);

        // Limit OLX listings to 200
        olxListings = olxListings.slice(0, 200);

        // Combine listings
        const allListings = [...trimbitasuListings, ...olxListings];
        
        res.json({ 
            pages: allListings, 
            totalCount: allListings.length,
            trimbitasuCount: trimbitasuListings.length,
            olxCount: olxListings.length
        });
    } catch (error) {
        console.error('Error in /api/listings:', error.message);
        res.status(500).json({ error: 'An error occurred while fetching data', details: error.message });
    }
});

const httpsOptions = {
    key: fs.readFileSync('/opt/nifi/ssluri/private.key'),
    cert: fs.readFileSync('/opt/nifi/ssluri/fullchain.pem')
};

const httpsServer = https.createServer(httpsOptions, app);

httpsServer.listen(port, () => {
    console.log(`HTTPS server running on port ${port}`);
});