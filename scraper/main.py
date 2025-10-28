import os
import re
import io
import time
import logging
import requests
import pandas as pd
from tqdm import tqdm
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import pypdf

#specific URLs to scrape
TARGET_URLS = [ 
    "https://www.apsit.edu.in/about-us",
    "https://www.apsit.edu.in/permissions",
    "https://www.apsit.edu.in/sites/default/files/2025-06/Institutional%20Development%20Plan%20-%20APSIT_0.pdf",
    "https://www.apsit.edu.in/governing-body-1",
    "https://www.apsit.edu.in/node/41", # Principal
    "https://www.apsit.edu.in/controller-examination",
    "https://www.apsit.edu.in/index.php/board-management", # Board of Management
    "https://www.apsit.edu.in/index.php/academic-council", # Academic Council
    "https://www.apsit.edu.in/index.php/board-studies", # Board of Studies
    "https://www.apsit.edu.in/board-studies-bos-cse-artificial-intelligence-and-machine-learning", # BOS AIML
    "https://www.apsit.edu.in/index.php/finance-committee", # Finance Committee
    "https://www.apsit.edu.in/academic-leadership",
    "https://www.apsit.edu.in/ug-courses",
    "https://www.apsit.edu.in/cse-ai-and-ml", # AIML Department
    "https://www.apsit.edu.in/library",
    "https://www.apsit.edu.in/node/1463", # Seems related to AIML syllabus/info
    "https://www.apsit.edu.in/sites/default/files/2023-03/3%20and%204%20th%20sem%20syllabus_0.pdf", # Syllabus PDF
    "https://www.apsit.edu.in/sites/default/files/2022-11/6.42_T.E._AI_ML_DS_DE_R2019_Sep14.pdf", # Syllabus PDF
    "https://www.apsit.edu.in/sites/default/files/2024-05/BE%20Syllabus.pdf", # Syllabus PDF
    "https://www.apsit.edu.in/cseaiml-placement-data", # Placement Data AIML
    "https://www.apsit.edu.in/sites/default/files/2025-08/TandP%20data%20for%20website.pdf", # Placement Data PDF
    "https://www.apsit.edu.in/aiml-faculty",
    "https://www.apsit.edu.in/sites/default/files/2025-06/Brochure%202025-26%204mb.pdf", # Brochure PDF
    "https://www.apsit.edu.in/admission-notification",
    "https://www.apsit.edu.in/sites/default/files/2025-07/ADVT%20IL%201%202025.pdf", # Admission Ad PDF
    "https://www.apsit.edu.in/admission-documents",
    "https://www.apsit.edu.in/admission-criteria",
    "https://www.apsit.edu.in/admission-faqs",
    "https://www.apsit.edu.in/sites/default/files/2025-09/instructions-for-students-and-parents.pdf", # Instructions PDF
    "https://www.apsit.edu.in/sites/default/files/2025-09/Admission%20Schedule%20for%20ILS%20Quota.pdf", # Admission Schedule PDF
    "https://www.apsit.edu.in/data-science-faculty",
    "https://www.apsit.edu.in/computer-faculty",
    "https://www.apsit.edu.in/civil-faculty",
    "https://www.apsit.edu.in/mechanical-faculty",
    "https://www.apsit.edu.in/Information-faculty",
    "https://www.apsit.edu.in/has-faculty",
    "https://www.apsit.edu.in/fee-refund-policy",
    "https://www.apsit.edu.in/national-service-scheme",
    "https://www.apsit.edu.in/vision-and-mission-t-p", # Placement About
    "https://www.apsit.edu.in/health-facilities",
    "https://www.apsit.edu.in/anti-ragging-cell",
    "https://www.apsit.edu.in/alumni-association-details",
    "https://www.apsit.edu.in/RnD",
    "https://www.apsit.edu.in/national-service-scheme",
    "https://www.apsit.edu.in/vision-and-mission-t-p",
    "https://www.apsit.edu.in/anti-ragging-cell",
    "https://www.apsit.edu.in/index.php/exalt-2019",
    "https://www.apsit.edu.in/index.php/counselling",
    "https://www.apsit.edu.in/index.php/student-council",
    "https://www.apsit.edu.in/index.php/alumni-association-details"
]
DATA_DIR = "data" 
LOG_FILE = "scraper.log"
BASE_URL = "https://www.apsit.edu.in/" # Needed for domain checking

os.makedirs(DATA_DIR, exist_ok=True)

#LOGGING SETUP
logger = logging.getLogger(__name__)
logger.handlers.clear()
logger.setLevel(logging.INFO)

file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter("[%(levelname)s] %(message)s")
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

#HELPER FUNCTIONS

def clean_filename(url):
    """Turn a URL path into a safe filename."""
    parsed_url = urlparse(url)
    path = parsed_url.path
    if path.lower().endswith((".pdf", ".html", ".php")):
         name = os.path.basename(path)
         # Remove extension and clean common URL encodings
         name = os.path.splitext(name)[0].replace('%20', '_').replace('%', '_')
    elif not path or path == '/':
        name = parsed_url.hostname or "index"
    else:
        name = path
    # General cleaning for filesystem compatibility
    name = re.sub(r'[\\/*?:"<>|]', "_", name)
    name = name.replace('%20', '_').replace('%', '_') # Catch edge cases
    return name.strip('/').strip('_').replace("/", "_") or "index"

def save_text(content, path):
    """Saves text content to a file."""
    try:
        with open(path, "w", encoding="utf-8", errors="replace") as f:
            f.write(content)
    except Exception as e:
        logger.error(f"[SAVE FAIL] Failed to save text to {path}: {e}")

def extract_pdf_text(pdf_url, pdf_name_cleaned):
    """Download PDF, extract text, and save ONLY IF the file doesn't exist."""
    pdf_save_path = os.path.join(DATA_DIR, f"{pdf_name_cleaned}.txt")
    if os.path.exists(pdf_save_path):
        logger.info(f"[PDF SKIP] Already extracted: {os.path.basename(pdf_save_path)}")
        return
    try:
        logger.info(f"[PDF START] Downloading: {pdf_url}")
        time.sleep(0.5) # Be polite
        response = requests.get(pdf_url, timeout=30, headers=REQUEST_HEADERS)
        response.raise_for_status()

        content_type = response.headers.get('Content-Type', '').lower()
        if 'application/pdf' not in content_type:
             logger.warning(f"[PDF WARN] URL did not return PDF content: {pdf_url} ({content_type})")
             return

        pdf_file = io.BytesIO(response.content)
        reader = pypdf.PdfReader(pdf_file)
        text = ""
        for page_num, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            except Exception as page_e:
                logger.warning(f"[PDF WARN] Page {page_num+1} extraction failed for {pdf_url}: {page_e}")
        save_text(text, pdf_save_path)
        logger.info(f"[PDF OK] Extracted: {pdf_url} -> {os.path.basename(pdf_save_path)}")
    except pypdf.errors.PdfReadError as pdf_e:
         logger.error(f"[PDF FAIL] Corrupt or encrypted PDF {pdf_url}: {pdf_e}")
    except requests.exceptions.Timeout:
         logger.error(f"[PDF FAIL] Timeout downloading {pdf_url}")
    except requests.exceptions.RequestException as req_e:
        logger.error(f"[PDF FAIL] Network error downloading {pdf_url}: {req_e}")
    except Exception as e:
        logger.error(f"[PDF FAIL] General error processing {pdf_url}: {e}", exc_info=True)

def extract_tables(html_content, page_name):
    """Save any HTML tables as CSVs if they don't exist."""
    try:
        tables = pd.read_html(io.StringIO(html_content))
        if not tables:
             logger.debug(f"[TABLE INFO] No HTML tables found on page {page_name}")
             return

        for i, table in enumerate(tables):
            if table.empty: continue
            csv_path = os.path.join(DATA_DIR, f"{page_name}_table_{i}.csv")
            if not os.path.exists(csv_path):
                table.to_csv(csv_path, index=False)
                logger.info(f"[TABLE OK] Saved: {os.path.basename(csv_path)}")
            else:
                 logger.info(f"[TABLE SKIP] Exists: {os.path.basename(csv_path)}")
    except ValueError:
        logger.debug(f"[TABLE INFO] No HTML tables found on page {page_name}")
    except ImportError:
         logger.error("[TABLE FAIL] `lxml` not installed? `pip install lxml` might be needed.")
    except Exception as e:
        logger.error(f"[TABLE FAIL] Failed parsing tables for {page_name}: {e}")

#MAIN SCRAPER FUNCTION FOR TARGETED URLS
def scrape_target_url(url, base_url_for_domain_check):
    """Scrapes a specific URL for text, any PDFs linked, and tables."""

    page_name = clean_filename(url)
    save_path = os.path.join(DATA_DIR, f"{page_name}.txt")
    html_content = None # Initialize html_content
    is_new_scrape = False

    if os.path.exists(save_path):
        logger.info(f"[PAGE SKIP] Main text exists: {os.path.basename(save_path)}")
        try:
            time.sleep(0.5)
            response = requests.get(url, timeout=15, headers=REQUEST_HEADERS)
            response.raise_for_status()
            html_content = response.text # Still need content for links/tables
        except requests.exceptions.RequestException as e:
             logger.error(f"[PAGE CHECK FAIL] Could not fetch skipped page {url} to check content: {e}")
             return
    else:
        try:
            logger.info(f"[PAGE START] Scraping {url}")
            time.sleep(0.5)
            response = requests.get(url, timeout=20, headers=REQUEST_HEADERS)
            response.raise_for_status()

            content_type = response.headers.get('Content-Type', '').lower()
            if 'text/html' not in content_type:
                 logger.warning(f"[PAGE WARN] Skipped non-HTML content at {url} ({content_type})")
                 return

            html_content = response.text
            soup = BeautifulSoup(html_content, "html.parser")

            for tag in soup(["script", "style", "noscript", "header", "footer", "nav", "aside"]):
                tag.decompose()
            text_content = soup.get_text(separator='\n', strip=True)
            text_content = "\n".join([line for line in text_content.splitlines() if line.strip()])
            save_text(text_content, save_path)
            logger.info(f"[PAGE OK] Scraped: {url} -> {os.path.basename(save_path)}")
            is_new_scrape = True

        except requests.exceptions.Timeout:
             logger.error(f"[PAGE FAIL] Timeout error scraping {url}")
             return
        except requests.exceptions.RequestException as e:
            logger.error(f"[PAGE FAIL] Network error scraping {url}: {e}")
            return
        except Exception as e:
             logger.error(f"[PAGE FAIL] Unexpected error scraping {url}: {e}", exc_info=True)
             return

    #Extract PDFs and Tables (Runs if html_content was fetched)
    if html_content:
        if 'soup' not in locals(): # Create soup if we loaded content for checks only
             soup = BeautifulSoup(html_content, "html.parser")

        pdf_links = [a for a in soup.find_all("a", href=True) if a["href"].lower().endswith(".pdf")]
        if pdf_links:
            logger.info(f"    Found {len(pdf_links)} potential PDFs on {url}...")
            for link in pdf_links:
                href = link["href"]
                pdf_url = urljoin(url, href)
                # Check domain using the passed base_url
                if urlparse(pdf_url).hostname == urlparse(base_url_for_domain_check).hostname:
                    pdf_name_cleaned = clean_filename(pdf_url)
                    extract_pdf_text(pdf_url, pdf_name_cleaned)

        extract_tables(html_content, page_name)

#MAIN EXECUTION
if __name__ == "__main__":
    start_time = time.time()
    logger.info(f"Starting TARGETED scraper for {len(TARGET_URLS)} URLs...\n")

    for target_url in tqdm(TARGET_URLS, desc="Scraping Target URLs"):
        if target_url.lower().endswith(".pdf"):
            pdf_name_cleaned = clean_filename(target_url)
            extract_pdf_text(target_url, pdf_name_cleaned)
        else:
            # Pass the BASE_URL for domain checking within the function
            scrape_target_url(target_url, BASE_URL)

    duration = time.time() - start_time
    logger.info(f"\nTargeted scraping completed in {duration:.2f} seconds.")
    logger.info(f"   Check the '{DATA_DIR}/' folder and '{LOG_FILE}' for results.")