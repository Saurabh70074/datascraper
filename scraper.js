const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const { parse } = require('csv-parse');

// Function to read data from a CSV file
async function readDataFromCsv(filePath) {
    return new Promise((resolve, reject) => {
        const data = [];
        fs.createReadStream(filePath)
            .pipe(parse({ columns: true }))
            .on('data', (row) => data.push(row))
            .on('end', () => resolve(data))
            .on('error', (error) => reject(error));
    });
}

// Function to log in to the website and fill out the registration form
async function registerUser(driver, userData) {
    await driver.get(userData.OnlinePortalLink);

    const downArrow = await driver.wait(until.elementLocated(By.className('loginBtn--s0uOa')), 30000);
    await downArrow.click();

    
    await driver.sleep(5000);
    // Click the "CREATE ACCOUNT" button with specific class
const createAccountButton = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(@class, 'Tabs__tab--Dr4aZ') and text()='CREATE ACCOUNT']")),
    30000
);
await driver.wait(until.elementIsVisible(createAccountButton), 30000);
await createAccountButton.click();
 // Allow time for UI to update

    // Fill out the registration form with data from userData
    try {
        // console.log('Waiting for country input...');
        // await driver.wait(until.elementLocated(By.css("react-select-registration-country-input")), 15000);
        // const countryInput = await driver.findElement(By.id("react-select-registration-country-input"));
        // await driver.wait(until.elementIsVisible(countryInput), 15000);
        // await countryInput.sendKeys(userData.Country);

        console.log('Waiting for zip code input...');
        await driver.wait(until.elementLocated(By.id('REGISTRATION_FORM-zipCode')), 15000);
        const zipInput = await driver.findElement(By.id('REGISTRATION_FORM-zipCode'));
        await zipInput.sendKeys(userData.ZIP);

        console.log('Waiting for first name input...');
        await driver.wait(until.elementLocated(By.id('REGISTRATION_FORM-given_name')), 15000);
        const firstNameInput = await driver.findElement(By.id('REGISTRATION_FORM-given_name'));
        await firstNameInput.sendKeys(userData.FirstName);

        console.log('Waiting for last name input...');
        await driver.wait(until.elementLocated(By.id('REGISTRATION_FORM-family_name')), 15000);
        const lastNameInput = await driver.findElement(By.id('REGISTRATION_FORM-family_name'));
        await lastNameInput.sendKeys(userData.LastName);

        console.log('Waiting for phone number input...');
        await driver.wait(until.elementLocated(By.id('Phone Number')), 15000);
        const phoneInput = await driver.findElement(By.id('Phone Number'));
        await phoneInput.sendKeys(userData.PhoneNumber);

        // Select dial code from dropdown
        const ul = await driver.wait(until.elementLocated(By.css('ul')), 60000);
        await driver.wait(until.elementIsVisible(ul), 60000);

        const listItems = await ul.findElements(By.css('li[data-dial-code]'));
        for (const item of listItems) {
            const dialCode = await item.getAttribute('data-dial-code');
            if (dialCode === userData.PhoneCountryCode) {
                await driver.wait(until.elementIsClickable(item), 60000);
                await item.click();
                console.log(`Selected dial code: ${dialCode}`);
                break;
            }
        }

        console.log('Waiting for email input...');
        await driver.wait(until.elementLocated(By.id('REGISTRATION_FORM-email')), 15000);
        const emailInput = await driver.findElement(By.id('REGISTRATION_FORM-email'));
        await emailInput.sendKeys(userData.Email);

        console.log('Waiting for password input...');
        await driver.wait(until.elementLocated(By.id('REGISTRATION_FORM-password')), 15000);
        const passwordInput = await driver.findElement(By.id('REGISTRATION_FORM-password'));
        await passwordInput.sendKeys(userData.Password);

        // Handle checkboxes based on conditions
        if (userData.TEXT !== 'YES') {
            const checkbox = await driver.findElement(By.name('preferredContactMethodText'));
            const isSelected = await checkbox.isSelected();
            if (!isSelected) {
                await checkbox.click();
                console.log("Checkbox for Text was not selected, now it is selected.");
            } else {
                console.log("Checkbox for Text is already selected.");
            }
        }

        if (userData.EMAILCondition !== 'YES') {
            const emailCheckbox = await driver.findElement(By.name('preferredContactMethodEmail'));
            await emailCheckbox.click();
        }

        if (userData.PHONE !== 'YES') {
            const phoneCheckbox = await driver.findElement(By.name('preferredContactMethodPhone'));
            const isSelected = await phoneCheckbox.isSelected();
            if (!isSelected) {
                await phoneCheckbox.click();
                console.log("Checkbox for Phone was not selected, now it is selected.");
            } else {
                console.log("Checkbox for Phone is already selected.");
            }
        }

        const consentCheckbox = await driver.wait(
            until.elementLocated(By.xpath("//label[contains(@class, 'Checkbox__container--EgE3c')]//input[@name='consented']")),
            15000
        );
        await driver.sleep(1000); // Adjust delay as needed
        await driver.executeScript("arguments[0].click();", consentCheckbox);
         // Scroll to the checkbox if needed
        const isChecked = await consentCheckbox.isSelected();
        if (!isChecked) {
            await consentCheckbox.click(); // Click to check the checkbox
            console.log("Checkbox 'consented' was not selected, now it is checked.");
        } else {
            console.log("Checkbox 'consented' is already selected.");
        }

        const submitButton = await driver.wait(
            until.elementLocated(By.xpath("//button[.//span[text()='Create Account']]")),
            30000
        );
        await driver.wait(until.elementIsVisible(submitButton), 30000);
        await submitButton.click();
        await driver.sleep(20000); // Allow time for submission

    } catch (error) {
        console.error('Error during registration:', error);
    }
}

(async function main() {
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled');
    chromeOptions.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    // Uncomment to run in headless mode
    // chromeOptions.addArguments('--headless');

    const driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

    try {
        const users = await readDataFromCsv('createUsers.csv');
        for (const userData of users) {
            await registerUser(driver, userData);
            await driver.sleep(5000); // Adjust as needed for form submission
        }
    } finally {
        await driver.quit();
    }
})();
