const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

(async () => {
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Set to true to run headless
  });

  // Open a new page
  const page = await browser.newPage();

  // Go to the login page
  await page.goto('https://ams.educause.edu/eweb/DynamicPage.aspx?Site=EDU&WebCode=LoginRequired&URL_success=https%3A%2F%2Feducause-netforum-bridge.proxy.cirrusidentity.com%2Fmodule.php%2Fnetforum%2Flinkback-tng.php%3Fstate%3D_7a8fab5ec4be83ffec30aea64cc993fa8fac5bbd6e%253Ahttps%253A%252F%252Feducause-netforum-bridge.proxy.cirrusidentity.com%252Fsaml2%252Fidp%252FSSOService.php%253Fspentityid%253Dhttps%25253A%25252F%25252Fsso.educause.edu%25252Fsp%2526ConsumerURL%253Dhttps%25253A%25252F%25252Fsso.educause.edu%25252Fmodule.php%25252Fsaml%25252Fsp%25252Fsaml2-acs.php%25252Feducause_proxy%2526cookieTime%253D1728886030%26usertoken%3D%7Btoken%7D', { waitUntil: 'networkidle2' });

  // Fill in login form
  await page.type('#eWebLoginControl_TextBoxLoginName', 'sumit.rawat@thoughtjumper.com'); // Replace with your username
  await page.type('#eWebLoginControl_TextBoxPassword', 'Sumit@1503'); // Replace with your password

  // Click the login button
  await page.click('#eWebLoginControl_LoginGoButton');

  // Wait for navigation after login
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Read links from the CSV file
  const links = [];
  fs.createReadStream(path.join(__dirname, 'CIO_ Senior-IT-members-LIST-USA.csv'))
    .pipe(csv())
    .on('data', (row) => {
      console.log('Row data:', row); // Log each row
      links.push(row.URL); // Ensure 'link' matches the column name in your CSV
    })
    .on('end', async () => {
      console.log('Links:', links); // Log the collected links

      const results = [];

      for (const link of links) {
        if (!link) {
          console.error('Link is undefined or empty. Skipping...');
          continue; // Skip this iteration if link is not valid
        }

        try {
          // Go to the profile page
          await page.goto(link, { waitUntil: 'networkidle2' });

          // Extract the required data
          const pageData = await page.evaluate(() => {
            const title = document.querySelector('.profile__meta-title')?.innerText || null;
            const org = document.querySelector('.profile__meta-org')?.innerText || null;
            const location = document.querySelector('.profile__meta-location')?.innerText || null;
            const phone = document.querySelector('.profile__meta-phone')?.innerText || null;
            const email = document.querySelector('.profile__meta-email')?.innerText || null;           
            const social = document.querySelector('.profile__meta-social')?.innerText || null;

            // Extract text from all <li> elements within <ul> under profile__meta
            const metaListItems = Array.from(document.querySelectorAll('.profile-header ul li'))
              .map(li => {
                // Extract text from h2 and h3 within each <li>
                const h2Text = li.querySelector('h2')?.innerText || null;
                const h3Text = li.querySelector('h3')?.innerText || null;
                return { h2Text, h3Text };
              })
              .filter(item => item.h2Text || item.h3Text); // Filter out empty items

            return {
              org,
              title,
              email,
              phone,
              social,
              location,
              metaListItems, // Include the list items in the returned data
            };
          });

          // Add the data to results
          results.push({ link, ...pageData });
        } catch (error) {
          console.error(`Error processing link ${link}:`, error);
        }
      }

      // Save results to JSON file
      fs.writeFileSync('results.json', JSON.stringify(results, null, 2), 'utf-8');
      console.log('Data saved to results.json');

      // Prepare CSV writer
      const csvWriter = createCsvWriter({
        path: 'results.csv',
        header: [
          { id: 'link', title: 'Link' },
          { id: 'title', title: 'Title' },
          { id: 'org', title: 'Organization' },
          { id: 'location', title: 'Location' },
          { id: 'phone', title: 'Phone' },
          { id: 'email', title: 'Email' },
          { id: 'social', title: 'Social' },
        ],
      });

      // Write results to CSV file
      await csvWriter.writeRecords(results);
      console.log('Data saved to results.csv');

      // Close the browser
      await browser.close();
    });
})();
