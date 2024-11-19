const fs = require('fs');
const { parse } = require('csv-parse');
const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { createObjectCsvWriter } = require('csv-writer');

// Function to read Website URLs from CSV
async function readUrlsFromCsv(filePath) {
    return new Promise((resolve, reject) => {
        const urls = [];
        fs.createReadStream(filePath)
            .pipe(parse({ columns: true }))
            .on('data', (row) => urls.push(row['Website URL'].trim()))
            .on('end', () => resolve(urls))
            .on('error', (error) => reject(error));
    });
}

// Function to check URL using Selenium
async function checkUrlWithSelenium(driver, url) {
    try {
        await driver.get(url); // Navigate to the URL
        await driver.sleep(5000); // Wait for the page to load

        // Check for the <h1> tag
        const h1Elements = await driver.findElements(By.tagName('h1'));
        if (h1Elements.length > 0) {
            const h1Text = await h1Elements[0].getText();
            if (h1Text.includes('Page not found')) {
                return '404 - Page Not Found';
            }
        }

        // Check the page title
        const title = await driver.getTitle();
        return title ? '200 - Page Loaded' : 'Error - No Title Found';
    } catch (error) {
        return 'Error - Failed to Load'; // Error accessing the page
    }
}

// Function to append a single URL status to the CSV file
async function appendToCsv(filePath, record) {
    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
            { id: 'url', title: 'Website URL' },
            { id: 'status', title: 'Status' },
        ],
        append: true, // Enables appending instead of overwriting
    });
    await csvWriter.writeRecords([record]);
}

// Main function
(async function main() {
    const inputFilePath = 'users-user_links_two.csv'; // Replace with your input CSV file path
    const outputFilePath = 'output_with_selenium_two.csv'; // Replace with your desired output file path

    // Check if the output file exists; if not, create it with headers
    if (!fs.existsSync(outputFilePath)) {
        const csvWriter = createObjectCsvWriter({
            path: outputFilePath,
            header: [
                { id: 'url', title: 'Website URL' },
                { id: 'status', title: 'Status' },
            ],
        });
        await csvWriter.writeRecords([]); // Initialize the file with headers
    }

    // Setup Selenium with Chrome
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--no-sandbox'); // Required for some environments
    chromeOptions.addArguments('--disable-dev-shm-usage'); // Prevent memory issues
    chromeOptions.addArguments('--disable-blink-features=AutomationControlled'); // Prevent detection
    // chromeOptions.addArguments('--headless'); // Uncomment for headless mode

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

    try {
        const urls = await readUrlsFromCsv(inputFilePath);
        console.log(`Found ${urls.length} URLs to check.`);

        for (const url of urls) {
            if (url) {
                console.log(`Navigating to: ${url}`);
                const status = await checkUrlWithSelenium(driver, url);
                console.log(`Status for ${url}: ${status}`);

                // Append the result to the output CSV file
                await appendToCsv(outputFilePath, { url, status });
            }
        }

        console.log(`All URLs processed. Results saved to ${outputFilePath}`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await driver.quit(); // Close the browser
    }
})();
