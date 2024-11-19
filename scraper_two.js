const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const { parse } = require('csv-parse');
const { createObjectCsvWriter } = require('csv-writer');

// Function to read URLs from a CSV file
async function readUrlsFromCsv(filePath) {
    return new Promise((resolve, reject) => {
        const urls = [];
        fs.createReadStream(filePath)
            .pipe(parse({ columns: true }))
            .on('data', (row) => urls.push(row.url)) // Assuming the column name for URLs is 'url'
            .on('end', () => resolve(urls))
            .on('error', (error) => reject(error));
    });
}

// Function to log in to the website
async function login(driver) {
    await driver.get('https://learn.sassoon-online.com');
    await driver.findElement(By.css('.navigation__account-item_login')).click();
    await driver.sleep(5000);
    await driver.findElement(By.name('user[email]')).sendKeys('rohit.negi1@boundlesslearning.com');
    await driver.findElement(By.name('user[password]')).sendKeys('Naruto@Love15_');
    await driver.findElement(By.css('.button-primary.g-recaptcha')).click();
    await driver.sleep(90000);

    // Check for CAPTCHA
    try {
        await driver.findElement(By.id('captchaElement'));
        console.log("CAPTCHA detected. Please solve it within 90 seconds.");
        await driver.sleep(90000);
        console.log("CAPTCHA check complete.");
    } catch (error) {
        console.log("No CAPTCHA detected.");
    }
}

// Function to extract all bundle details including expiry dates
async function extractAndSaveUserInfo(driver, csvWriter, url) {
    try {
        const userName = await driver.findElement(By.css('h1.MobileTitleBar_mobile-title-bar__title__78')).getText().catch(() => 'N/A');
        
        // Extract bundle rows
        const bundleRows = await driver.findElements(By.css('tbody tr.bundle-enrollments-row_kttW1'));

        // Ensure that at least the URL gets written even if no bundles are found
        if (bundleRows.length === 0) {
            const record = { userName, url, bundleName: 'N/A', enrollmentBadge: 'N/A', expiryDate: 'N/A' };
            await csvWriter.writeRecords([record]);
            console.log(`No bundles found. Saved minimal data for URL: ${url}`);
        }

        for (const row of bundleRows) {
            const bundleName = await row.findElement(By.css('td.bundle-enrollments-row__bundle-name_Pu24E span')).getText().catch(() => 'N/A');
            const enrollmentBadge = await row.findElement(By.css('td[data-qa="enrollment-badge"] span')).getText().catch(() => 'N/A');
            
            // Extract expiry date, default to 'N/A' if not found
            let expiryDate = 'N/A';
            const expiryDateElement = await row.findElements(By.css('td[data-qa="expiry-date"]'));
            if (expiryDateElement.length > 0) {
                expiryDate = await expiryDateElement[0].getText().catch(() => 'N/A');
            }

            const record = { userName, url, bundleName, enrollmentBadge, expiryDate };
            await csvWriter.writeRecords([record]); // Write to CSV for each bundle
            console.log(`Extracted and saved: ${JSON.stringify(record)}`);
        }
    } catch (error) {
        console.log(`Error extracting user info for URL: ${url}`, error);
        // Ensure we still log something even if an error occurs
        const record = { url, userName: 'Error', bundleName: 'Error', enrollmentBadge: 'Error', expiryDate: 'Error' };
        await csvWriter.writeRecords([record]);
    }
}

// Function to scrape URLs in parallel
async function scrapeUrlsInParallel(driver, csvWriter, urls, concurrency = 5) {
    const batches = [];
    for (let i = 0; i < urls.length; i += concurrency) {
        batches.push(urls.slice(i, i + concurrency));
    }

    for (const batch of batches) {
        // Process each batch sequentially to reduce chances of overloading
        for (const url of batch) {
            if (typeof url !== 'string' || url.trim() === '') {
                console.log(`Invalid URL: ${url}. Skipping...`);
                continue;
            }
            try {
                console.log(`Navigating to: ${url}`);
                await driver.get(url);
                await driver.sleep(5000); // Adjust sleep time as needed
                await extractAndSaveUserInfo(driver, csvWriter, url);
            } catch (error) {
                console.log(`Failed to navigate to or process URL: ${url}`, error);
            }
        }
    }
}

(async function main() {
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
    chromeOptions.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    // chromeOptions.addArguments('--headless'); // Uncomment to run headless

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

    try {
        // Perform login
        await login(driver);

        // Read URLs from CSV
        const urls = await readUrlsFromCsv('users-user_links_two.csv'); // Update to your CSV file path

        // CSV writer setup in append mode
        const csvWriter = createObjectCsvWriter({
            path: 'user_info_two.csv',
            header: [
                { id: 'url', title: 'URL' },
                { id: 'userName', title: 'User Name' },
                { id: 'bundleName', title: 'Bundle Name' },
                { id: 'enrollmentBadge', title: 'Enrollment Badge' },
                { id: 'expiryDate', title: 'Expiry Date' },
            ],
            append: true
        });

        // Scrape URLs in parallel with a concurrency of 5
        await scrapeUrlsInParallel(driver, csvWriter, urls, 5);

    } finally {
        // Close the browser
        await driver.quit();
    }
})();
