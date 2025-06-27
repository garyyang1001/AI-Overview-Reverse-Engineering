// Install with npm install @mendable/firecrawl-js
import FireCrawlApp from '@mendable/firecrawl-js';

const app = new FireCrawlApp({apiKey: insertmyapikey});

const scrapeResult = await app.scrapeUrl("https://studycentralau.com/work-in-australia/working-holiday-in-australia/", {
	formats: [ "markdown" ],
	onlyMainContent: true
});