import { scrapeMangaList } from './lib/scraper.js';

import { scrapeNekoList } from './lib/nekoScraper.js';



async function main() {

  console.log('Testing Nekopoi Scraper...');

  try {

    const neko = await scrapeNekoList(1);

    console.log('Nekopoi Data:', neko.videos.slice(0, 2));

  } catch (e) {

    console.error('Nekopoi Error:', e.message);

  }



  console.log('\nTesting Doujin Scraper...');

  try {

    const manga = await scrapeMangaList({ page: 1, limit: 2 });

    console.log('Manga Data:', manga);

  } catch (e) {

    console.error('Doujin Error (Pastikan .env sudah terisi):', e.message);

  }

}



main();