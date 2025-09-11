import requests
from bs4 import BeautifulSoup
import os


urls_to_scrape = {
    "home": "https://www.apsit.edu.in/",
    "about":"https://www.apsit.edu.in/about-us",
    "courses":"https://www.apsit.edu.in/ug-courses",
    "departments":"https://www.apsit.edu.in/departments",
    ""



}

#Directory to store the scraped data
DATA_DIR = "data"
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)


def scrape_page(url: str) -> str:
    """Takes a URL, scrapes its content, and returns cleaned text."""
    print(f"Scraping: {url}")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        for script_or_style in soup(['script', 'style']):
            script_or_style.decompose()
            
        clean_text = soup.get_text(separator='\n', strip=True)
        return clean_text
        
    except requests.exceptions.RequestException as e:
        print(f"Error scraping {url}: {e}")
        return None

# --- 3. Loop Through URLs and Save the Data ---
if __name__ == "__main__":
    for page_name, page_url in urls_to_scrape.items():
        # Scrape the content
        content = scrape_page(page_url)
        
        if content:
            # Create a unique filename for each page
            file_path = os.path.join(DATA_DIR, f"{page_name}.txt")
            
            # Save the cleaned text to the file
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Successfully saved data to {file_path}")
        
        print("-" * 20)

    print("All pages have been scraped.")