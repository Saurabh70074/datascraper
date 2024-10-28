const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const { parse } = require('csv-parse');

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
    await driver.get('https://thinkrific-dev.polsdev.com/login/index.php');
    await driver.findElement(By.name('username')).sendKeys('rohit.negi1');
    await driver.findElement(By.name('password')).sendKeys('Naruto@Love15_');
    await driver.findElement(By.css('#loginbtn')).click();
    await driver.sleep(90000);

    // Check for CAPTCHA
    try {
        await driver.findElement(By.id('captchaElement'));
        console.log("CAPTCHA detected. Please solve it within 90 seconds.");
    } catch (error) {
        console.log("No CAPTCHA detected.");
    }
}

// Function to perform actions on the page for each URL
async function processUrlsInParallel(driver, urls) {
    for (const url of urls) {
        if (typeof url !== 'string' || url.trim() === '') {
            console.log(`Invalid URL: ${url}. Skipping...`);
            continue;
        }
        
        try {
            console.log(`Navigating to: ${url}`);
            await driver.get(url);
            
            // Wait for the down arrow to be clickable
            const downArrow = await driver.wait(
                until.elementLocated(By.className('form-autocomplete-downarrow')),
                10000
            );
            await downArrow.click();
    
            // Wait for the dropdown option to appear
            const sassoonOption = await driver.wait(
                until.elementLocated(By.css('li[data-value="12"]')),
                10000
            );
            await sassoonOption.click();
            await driver.sleep(5000);
            const id_customint2_label = await driver.findElement(By.css('#id_customint2_label'));
            await driver.wait(until.elementIsEnabled(id_customint2_label), 3000); // Ensure button is enabled
            await id_customint2_label.click();
            // Click on the "Add method" button
            const addButton = await driver.findElement(By.css('#id_submitbutton'));
            await driver.wait(until.elementIsEnabled(addButton), 3000); // Ensure button is enabled
            await addButton.click();
    
            // Wait for 5 seconds for the next page to load
            await driver.sleep(5000);
    
            console.log(`Processed URL: ${url} successfully.`);
        } catch (error) {
            console.log(`Error processing URL: ${url}`, error);
        }
    }
}

(async function main() {
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
    chromeOptions.addArguments(
        'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );
    // Uncomment the line below to run in headless mode
    // chromeOptions.addArguments('--headless');

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

    try {
        // Perform login
        await login(driver);

        // Read URLs from CSV
        const urls = await readUrlsFromCsv('users-user_links.csv'); // Update with your CSV file path

        // Process URLs one by one
        await processUrlsInParallel(driver, urls);

    } finally {
        // Close the browser
        await driver.quit();
    }
})();
