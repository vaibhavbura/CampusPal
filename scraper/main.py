import os
import re
import io
import time
import logging
import requests
import pandas as pd
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from tqdm import tqdm
import pypdf
import concurrent.futures  
import threading           


BASE_URL = "https://www.apsit.edu.in/"  # The starting point for our scrape
DATA_DIR = "data"  # Where we'll save all the good stuff
LOG_FILE = "scraper.log"  # A log file to see what's happening and debug errors
MAX_DEPTH = 1  # How deep to crawl. 0=homepage only, 1=homepage + all links on it
MAX_WORKERS = 10 # How many pages to scrape at the same time (concurrently)

# Get the "apsit.edu.in" part to make sure we don't accidentally crawl Google
BASE_HOSTNAME = urlparse(BASE_URL).hostname 

# Make sure the 'data' folder exists before we try to save stuff to it
os.makedirs(DATA_DIR, exist_ok=True)


# Setup Logging
# This is a bit fancy, but it lets us log to *both* a file and the console.
# It's super helpful for debugging a long-running scrape.
logger = logging.getLogger()
logger.setLevel(logging.INFO) 

# 1. Log to a file
file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# 2. Log to the console
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter("[%(levelname)s] %(message)s")
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)


# Pretend to be a real browser (Mozilla Firefox on Windows)
# Some websites block scripts, so a User-Agent helps us look like a person
REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# Keep track of pages we've already scraped to avoid getting stuck in infinite loops
visited = set()
visited_lock = threading.Lock() # A lock to make sure threads don't update 'visited' at the same time


def clean_filename(url):
    """
    Takes a URL and turns it into a safe filename.
    e.g., "https://.../about/us.html" -> "about_us"
    """
    # Get the path part of the URL (e.g., "/about/us.html")
    name = urlparse(url).path
    # Remove any characters that aren't allowed in filenames
    name = re.sub(r'[\\/*?:"<>|]', "_", name)
    # Tidy it up: remove leading/trailing underscores and switch "/" to "_"
    return name.strip("_").replace("/", "_") or "index" # Use "index" if the path is empty (homepage)

def save_text(content, path):
    """Helper function to just write text to a file."""
    # 'errors="replace"' is a safety net for any weird characters
    # that utf-8 can't handle, preventing the script from crashing.
    with open(path, "w", encoding="utf-8", errors="replace") as f:
        f.write(content)

def extract_pdf_text(pdf_url, page_name):
    """
    Downloads a PDF from a URL, rips the text out, and saves it as a .txt file.
    'page_name' is used to create a unique filename, e.g., "admissions_fee_structure.txt"
    """
    try:
        # 1. Download the PDF file
        response = requests.get(pdf_url, timeout=15, headers=REQUEST_HEADERS)
        response.raise_for_status() # Check if the download failed
        
        # 2. Load it into memory so we don't have to save it as a .pdf first
        pdf_file = io.BytesIO(response.content)
        
        # 3. Use pypdf to read the in-memory file
        reader = pypdf.PdfReader(pdf_file)

        text = ""
        # 4. Loop through each page and grab the text
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n" # Add a newline between pages
        
        # 5. Save the combined text to our main DATA_DIR
        pdf_path = os.path.join(DATA_DIR, f"{page_name}.txt")
        save_text(text, pdf_path)
        logging.info(f"[PDF OK] Extracted: {pdf_url}")
    except Exception as e:
        # Catch failures if the PDF is broken, password-protected, or the link is dead
        logging.error(f"[PDF FAIL] Failed: {pdf_url}: {e}")

def extract_tables(html_content, page_name):
    """
    Finds any <table> tags in the HTML and saves them as CSV files.
    This is amazing for faculty lists, placement stats, etc.
    """
    try:
        # pandas.read_html() is magic. It scans the HTML and returns
        # a list of all tables it finds as DataFrame objects.
        tables = pd.read_html(io.StringIO(html_content))
        for i, table in enumerate(tables):
            # If the page has multiple tables, save them as "page_name_table_0.csv", etc.
            csv_path = os.path.join(DATA_DIR, f"{page_name}_table_{i}.csv")
            table.to_csv(csv_path, index=False)
            logging.info(f"[TABLE OK] Saved table from {page_name} -> {csv_path}")
    except ValueError:
        # This isn't really an error. It just means pandas didn't find any
        # tables on the page, which is fine. We just log it for debugging.
        logging.debug(f"[TABLE INFO] No tables found on page {page_name}")
    except Exception as e:
        # This is a real error, e.g., pandas couldn't parse a weirdly-formed table
        logging.error(f"[TABLE FAIL] Failed to parse tables on page {page_name}: {e}")


def scrape_page(url, depth, executor):
    """
    This is the main workhorse function. It scrapes a single page
    and then submits new links to the thread pool executor.
    """
    
    # --- Safety Checks ---
    # We stop scraping this path if:
    # 1. We've gone too deep
    # 2. We've already scraped this exact URL (checked in a thread-safe way)
    if depth > MAX_DEPTH:
        return

    try:
        current_hostname = urlparse(url).hostname
    except Exception:
        return # Got a bad/malformed URL, just ignore it and stop.

    # 3. The link goes to a different website (e.g., Google, Facebook, etc.)
    if current_hostname != BASE_HOSTNAME:
        return

    # --- Thread-Safe 'visited' Check ---
    # We must 'lock' the visited set before checking/writing to it.
    # This prevents two threads from trying to add the same URL at the
    # exact same time (a "race condition").
    with visited_lock:
        if url in visited:
            return # Another thread is already scraping (or has scraped) this
        # If we're here, it's a new, valid page. Add it to our 'visited' set.
        visited.add(url)

    try:
        # WARNING: This is much faster but RISKY. You may get IP banned
        # by the website for scraping too aggressively.
        
        response = requests.get(url, timeout=15, headers=REQUEST_HEADERS)
        response.raise_for_status() # Exit if the page is broken (e.g., 404 error)
        
        html_content = response.text
        soup = BeautifulSoup(html_content, "html.parser")
        
        # --- Clean the HTML ---
        # Rip out all the <script> and <style> tags. We only
        # want the human-readable text, not a bunch of JavaScript or CSS.
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()

        # Get the clean text, using newlines to keep some structure
        text = soup.get_text(separator='\n', strip=True)
        page_name = clean_filename(url)
        save_path = os.path.join(DATA_DIR, f"{page_name}.txt")
        save_text(text, save_path)
        logging.info(f"[PAGE OK] Scraped: {url}")

        # --- Now, find all the goodies on this page ---
        # (These will run inside the current thread)
        
        # 1. Find all PDF links
        pdf_links = [link for link in soup.find_all("a", href=True) if link["href"].endswith(".pdf")]
        if pdf_links:
            logging.info(f"    Found {len(pdf_links)} PDFs on this page...")
            for link in pdf_links:
                href = link["href"]
                pdf_url = urljoin(url, href)
                pdf_name = os.path.basename(href).replace(".pdf", "")
                extract_pdf_text(pdf_url, page_name + "_" + pdf_name)

        # 2. Find all tables
        extract_tables(html_content, page_name)

        # --- Find New Jobs for the Thread Pool ---
        if depth < MAX_DEPTH:
            links_to_crawl = []
            for link in soup.find_all("a", href=True):
                full_link = urljoin(url, link["href"])
                
                try:
                    link_hostname = urlparse(full_link).hostname
                except Exception:
                    continue # Skip bad links

                # We only need to check hostname here. The 'visited' check
                # will be handled by the function when it starts.
                if (link_hostname == BASE_HOSTNAME and 
                    full_link not in links_to_crawl):
                         links_to_crawl.append(full_link)
            
            if links_to_crawl:
                logging.info(f"    Found {len(links_to_crawl)} new links to submit...")
                for full_link in links_to_crawl:
                    # Instead of calling the function directly, we submit
                    # it as a new job to the thread pool.
                    executor.submit(scrape_page, full_link, depth + 1, executor)

    except requests.exceptions.RequestException as e:
        logging.error(f"[PAGE FAIL] Error scraping {url}: {e}")


# --- Start the Scrape ---
# This makes sure the code only runs when you execute `python main.py`
# and not if it's imported by another script.
if __name__ == "__main__":
    start_time = time.time()
    print(f"Starting advanced scraper for {BASE_URL} (MAX_DEPTH={MAX_DEPTH}, MAX_WORKERS={MAX_WORKERS})\n")
    
    # Create the thread pool
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Kick off the whole process by submitting the *first* job
        executor.submit(scrape_page, BASE_URL, 0, executor)
    
    # The 'with' block will automatically wait for all submitted jobs
    # (and any jobs they submit) to finish before moving on.
    
    print(f"\nScraping completed in {time.time() - start_time:.2f}s. Check the 'data/' folder.")

