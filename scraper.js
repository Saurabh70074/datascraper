const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function login(driver) {
    // Open the login page
    await driver.get('https://learn.sassoon-online.com');

    // Click the login button
    await driver.findElement(By.css('.navigation__account-item_login')).click();

    // Wait for the page to load
    await driver.sleep(5000);

    // Enter email and password
    await driver.findElement(By.name('user[email]')).sendKeys('rohit.negi1@boundlesslearning.com');
    await driver.findElement(By.name('user[password]')).sendKeys('Naruto@Love15_');

    // Submit the login form
    await driver.findElement(By.css('.button-primary.g-recaptcha')).click();

    // Wait for navigation after login
    await driver.sleep(10000);

    // Check for CAPTCHA
    try {
        await driver.findElement(By.id('captchaElement'));
        console.log("CAPTCHA detected. Please solve it manually.");
        await new Promise((resolve) => {
            process.stdin.once('data', () => {
                resolve();
            });
        });
    } catch (error) {
        console.log("No CAPTCHA detected.");
    }
}

// async function extractAndSaveUserLinks(driver) {
//     // Navigate to the user management page
//     await driver.get('https://learn.sassoon-online.com/manage/users');

//     // CSV writer setup
//     const csvWriter = createCsvWriter({
//         path: 'user_links.csv',
//         header: [
//             { id: 'userName', title: 'User Name' },
//             { id: 'link', title: 'Link' },
//         ],
//     });

//     const records = [];

//     let hasNextPage = true;

//     while (hasNextPage) {
//         // Wait for the page to load
//         await driver.sleep(5000);

//         // Find all <td> elements with data-qa="user-name"
//         const userNameElements = await driver.findElements(By.css('td[data-qa="user-name"]'));

//         // Extract user name and link data from the current page
//         for (const userNameElement of userNameElements) {
//             try {
//                 // Find the <a> tag within the <td>
//                 const linkElement = await userNameElement.findElement(By.tagName('a'));
//                 const userName = await linkElement.getText(); // Get the text of the user name
//                 const userLink = await linkElement.getAttribute('href'); // Get the href attribute

//                 // Add to records
//                 records.push({ userName, link: userLink });
//                 console.log(`Extracted: ${userName}, ${userLink}`);
//             } catch (error) {
//                 console.log("Error extracting user data:", error);
//             }
//         }

//         // Try to click the next page button (class "toga-icon-arrow-right")
//         try {
//           await driver.findElement(By.css('.toga-icon-arrow-right')).click();
          
//           console.log("Next page clicked.");
      
//           // Wait for the new content to load, for example, wait for a specific element to appear
//           await driver.wait(until.elementLocated(By.css('td[data-qa="user-name"]')), 10000); // Adjust time as necessary
//       } catch (error) {
//           console.log("No more pages to navigate or error clicking next:", error);
//           hasNextPage = false;
//       }
      
//     }

//     // Write to CSV
//     await csvWriter.writeRecords(records);
//     console.log('User links have been saved to user_links.csv');
// }

async function extractAndSaveUserLinks(driver) {
  // Navigate to the user management page
  await driver.get('https://learn.sassoon-online.com/manage/users');

  // CSV writer setup
  const csvWriter = createCsvWriter({
      path: 'user_links.csv',
      header: [
          { id: 'userName', title: 'User Name' },
          { id: 'link', title: 'Link' },
      ],
  });

  const records = [];
  let hasNextPage = true;

  while (hasNextPage) {
      // Wait for the page to load completely
      await driver.sleep(5000);

      // Find all <td> elements with data-qa="user-name"
      const userNameElements = await driver.findElements(By.css('td[data-qa="user-name"]'));

      // Extract user name and link data from the current page
      for (const userNameElement of userNameElements) {
          try {
              // Find the <a> tag within the <td>
              const linkElement = await userNameElement.findElement(By.tagName('a'));
              const userName = await linkElement.getText(); // Get the text of the user name
              const userLink = await linkElement.getAttribute('href'); // Get the href attribute

              // Add to records
              records.push({ userName, link: userLink });
              console.log(`Extracted: ${userName}, ${userLink}`);
          } catch (error) {
              console.log("Error extracting user data:", error);
          }
      }

      // Try to click the next page button (class "toNextBtn")
      try {
          const nextButton = await driver.findElement(By.css('.toNextBtn'));
          if (nextButton) {
              await nextButton.click();
              console.log("Next page clicked.");
              // Wait for the new content to load, for example, wait for a specific element to appear
              await driver.findElements(By.css('td[data-qa="user-name"]'), 10000); // Adjust time as necessary

          } else {
              hasNextPage = false; // If no next button is found, assume no more pages
          }
      } catch (error) {
          console.log("No more pages to navigate or error clicking next:", error);
          hasNextPage = false; // Stop looping if there are no more pages or an error occurs
      }
  }

  // Write to CSV
  await csvWriter.writeRecords(records);
  console.log('User links have been saved to user_links.csv');
}


(async function main() {
    // Chrome options
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-blink-features=AutomationControlled'); // Hide automation flag
    chromeOptions.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    // chromeOptions.addArguments('--headless');  // Uncomment to run headless

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

    try {
        // Perform login
        await login(driver);
        // Extract user links and save to CSV
        await extractAndSaveUserLinks(driver);
    } finally {
        // Close the browser
        await driver.quit();
    }
})();
