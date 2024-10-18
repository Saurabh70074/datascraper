import time
import csv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options

# Setup Chrome WebDriver
chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--disable-blink-features=AutomationControlled')  # Hide automation flag
chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
# chrome_options.add_argument('--headless')  # Set to False if you want to see the browser

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

def login():
    # Open the login page
    driver.get('https://learn.sassoon-online.com')

    # Click the login button
    login_button = driver.find_element(By.CSS_SELECTOR, '.navigation__account-item_login')
    login_button.click()

    # Wait for the page to load
    time.sleep(5)

    # Enter email and password
    driver.find_element(By.NAME, 'user[email]').send_keys('rohit.negi1@boundlesslearning.com')
    driver.find_element(By.NAME, 'user[password]').send_keys('Naruto@Love15_')

    # Submit the login form
    login_button = driver.find_element(By.CSS_SELECTOR, '.button-primary.g-recaptcha')
    login_button.click()

    # Wait for navigation after login
    time.sleep(10)

    # Check for CAPTCHA
    try:
        driver.find_element(By.ID, 'captchaElement')
        print("CAPTCHA detected. Please solve it manually.")
        input("Press Enter after solving the CAPTCHA...")
    except:
        print("No CAPTCHA detected.")

def extract_and_save_user_links():
    # Wait for the page to load (increase if necessary)
    time.sleep(5)

    # Find all <td> elements with data-qa="user-name"
    user_name_elements = driver.find_elements(By.CSS_SELECTOR, 'td[data-qa="user-name"]')

    # Open a CSV file to write
    with open('user_links.csv', mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['User Name', 'Link'])  # Writing header row

        for user_name_element in user_name_elements:
            # Find the <a> tag within the <td>
            link_element = user_name_element.find_element(By.TAG_NAME, 'a')
            user_name = link_element.text  # Get the text of the user name
            user_link = link_element.get_attribute('href')  # Get the href attribute

            # Write to the CSV file
            writer.writerow([user_name, user_link])
            print(f'Extracted: {user_name}, {user_link}')

if __name__ == '__main__':
    try:
        # Perform login
        login()
        # Extract user links and save to CSV
        extract_and_save_user_links()
    finally:
        # Close the browser
        driver.quit()
