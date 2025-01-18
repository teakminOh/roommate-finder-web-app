import axios from 'axios';
import * as cheerio from 'cheerio';
import { MongoClient } from 'mongodb';
import pLimit from 'p-limit';
import { MONGO_URI } from '../config.js';

const DATABASE_NAME = 'real-estate';

const COLLECTION_NAME = 'properties';

// MongoDB client
const client = new MongoClient(MONGO_URI);

async function saveToMongoDB(data, scrapeTimestamp) {
  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Ensure the 'link' field is unique by creating an index
    await collection.createIndex({ link: 1 }, { unique: true });

    // Use upsert to update existing documents or insert new ones
    const operations = data.map((property) => ({
      updateOne: {
        filter: { link: property.link }, // Use 'link' as the unique key
        update: { $set: { ...property, lastUpdated: scrapeTimestamp } },
        upsert: true,
      },
    }));

    // Execute the bulk operation
    const result = await collection.bulkWrite(operations);
    console.log(`${result.upsertedCount} records added, ${result.modifiedCount} records updated.`);
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
  } finally {
    await client.close();
  }
}

async function removeStaleRecords(scrapeTimestamp) {
  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Remove records that were not updated during this scrape
    const result = await collection.deleteMany({ lastUpdated: { $lt: scrapeTimestamp } });
    console.log(`${result.deletedCount} stale records removed.`);
  } catch (error) {
    console.error('Error removing stale records:', error);
  } finally {
    await client.close();
  }
}



async function scrapeProperties(url = 'https://reality.bazos.sk/', pageLimit = 1) {
  try {
    const scrapeTimestamp = Date.now(); 
    let currentPage = 1;
    const allProperties = []; // Array to hold all properties

    while (currentPage <= pageLimit) {
      console.log(`Scraping page ${currentPage}: ${url}`);

      // Fetch the HTML content of the target website
      const response = await axios.get(url);
      const html = response.data;

      // Load the HTML into Cheerio
      const $ = cheerio.load(html);

      // Array to hold the extracted properties for the current page
      const properties = [];

      // Select property cards (adjust selector based on the website structure)
      $('.inzeraty').each((index, element) => {
        const title = $(element).find('h2.nadpis a').text().trim();
        const date = $(element).find('.velikost10').text().match(/\[.*?\]/)?.[0] || 'N/A';
        const link = `https://reality.bazos.sk${$(element).find('h2.nadpis a').attr('href')}`;
        const price = $(element).find('.inzeratycena b').text().trim() || 'Dohodou';

        // Separate city and postal code
        const locationRaw = $(element).find('.inzeratylok').text().trim() || 'Neznáma lokalita';
        const [city, postalCode] = splitLocation(locationRaw);

        // Add the property with basic details
        properties.push({ title, date, link, price, location: `${city} ${postalCode}` });
      });

      // Limit concurrent requests for fetching details
      const limit = pLimit(20); // Set concurrency limit to 5
      const detailedProperties = await Promise.all(
        properties.map((property) =>
          limit(async () => {
            const detailedData = await getDetailedPropertyInfo(property.link);
            Object.assign(property, detailedData); // Merge additional details

            // Determine sale type using fullDescription
            property.saleType = determineSaleType(property.fullDescription, property.price);

            // Extract phone number from fullDescription
            property.phoneNumber = extractPhoneNumber(property.fullDescription);

            return property;
          })
        )
      );

      // Append detailed properties to the global array
      allProperties.push(...detailedProperties);

      // Check for the "Next" page
      const nextPageLink = $('div.strankovani a:contains("Ďalšia")').attr('href');
      if (!nextPageLink) break; // Stop if there are no more pages

      url = `https://reality.bazos.sk${nextPageLink}`;
      currentPage++;
    }

    // Save all collected data to MongoDB in a single bulk operation
    console.log(`Inserting ${allProperties.length} records into MongoDB...`);
    await saveToMongoDB(allProperties);
    await removeStaleRecords(scrapeTimestamp);

    console.log('Scraping and saving complete.');
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

// Helper function to fetch details from the property detail page
async function getDetailedPropertyInfo(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract full description
    const fullDescription = $('.popisdetail').text().trim();

    // Extract all image URLs and prioritize the highest resolution ones
    const images = [];
    $('.carousel-cell img').each((_, img) => {
      const lazyLoadImage = $(img).attr('data-flickity-lazyload');
      const srcImage = $(img).attr('src');
      if (lazyLoadImage) {
        images.push(lazyLoadImage);
      } else if (srcImage) {
        images.push(srcImage);
      }
    });

    return { fullDescription, images };
  } catch (error) {
    console.error(`Error fetching details for ${url}:`, error);
    return { fullDescription: 'Unable to fetch', images: [] };
  }
}

// Helper function to split location into city and postal code
function splitLocation(location) {
  const match = location.match(/(.*?)(\d{3}\s?\d{2})$/);
  if (match) {
    const city = match[1].trim();
    const postalCode = match[2].trim();
    return [city, postalCode];
  }
  return [location, ''];
}

// Helper function to determine the sale type
function determineSaleType(fullDescription, price) {
  const priceValue = parseInt(price.replace(/[^\d]/g, ''), 10);
  if (priceValue > 10000) return 'Na predaj';

  const text = fullDescription.toLowerCase();
  const saleKeywords = ['na predaj', 'predaj', 'predáva', 'predávať', 'predávam', 'predám', 'predávajú'];
  const rentKeywords = ['na prenájom', 'prenajíma', 'prenajímať', 'prenajímam', 'prenajímajú'];

  const isForSale = saleKeywords.some((word) => text.includes(word));
  const isForRent = rentKeywords.some((word) => text.includes(word));

  if (isForSale && isForRent) return 'Prenájom/Predaj';
  if (isForSale) return 'Na predaj';
  if (isForRent) return 'Na prenájom';

  // Default if no keywords match
  return 'Neznámy';
}

// Helper function to extract phone numbers from a description
function extractPhoneNumber(description) {
  const match = description.match(/(\+421\s?\d{2}\s?\d{3}\s?\d{3}|09\d{2}\s?\d{3}\s?\d{3})/);
  return match ? match[0].replace(/\s+/g, '') : 'N/A';
}

// Run the scraper
scrapeProperties();
