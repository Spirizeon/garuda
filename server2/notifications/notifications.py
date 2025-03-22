from fastapi import FastAPI, BackgroundTasks
import requests
from bs4 import BeautifulSoup
from twilio.rest import Client
import time
import hashlib
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store scraped jobs with a hash-based tracking system
scraped_jobs = []
job_hashes = set()  # To track unique jobs

# Twilio configuration
TWILIO_ACCOUNT_SID = "your_twilio_account_sid"
TWILIO_AUTH_TOKEN = "your_twilio_auth_token"
TWILIO_PHONE_NUMBER = "your_twilio_number"
RECIPIENT_PHONE_NUMBER = "recipient_phone_number"

# Job sources configuration
JOB_SOURCES = {
    "indeed": {
        "url": "https://www.indeed.com/jobs?q=software+engineer&l=",
        "card_selector": "div.job_seen_beacon",
        "title_selector": "h2.jobTitle",
        "company_selector": "span.companyName",
        "link_selector": "a.jcs-JobTitle",
        "base_url": "https://www.indeed.com"
    },
    "linkedin": {
        "url": "https://www.linkedin.com/jobs/search/?keywords=software%20engineer",
        "card_selector": "div.base-card",
        "title_selector": "h3.base-search-card__title",
        "company_selector": "h4.base-search-card__subtitle",
        "link_selector": "a.base-card__full-link",
        "base_url": ""
    }
}

# Search parameters - could be expanded to be configurable
SEARCH_KEYWORDS = ["software engineer", "python developer", "full stack"]
SEARCH_LOCATIONS = ["remote", "new york", "san francisco"]

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Real-Time Job Notification System!"}

@app.post("/start-scraping")
async def start_scraping(background_tasks: BackgroundTasks):
    # Start the scheduler if it's not already running
    if not scheduler.running:
        scheduler.start()
    return {"message": "Job scraping scheduler started! Now monitoring for new jobs."}

@app.post("/stop-scraping")
async def stop_scraping():
    # Stop the scheduler if it's running
    if scheduler.running:
        scheduler.shutdown()
    return {"message": "Job scraping scheduler stopped."}

@app.get("/get-jobs")
async def get_jobs(limit: int = 50):
    global scraped_jobs
    return {"jobs": scraped_jobs[:limit]}

@app.post("/manual-check")
async def manual_check(background_tasks: BackgroundTasks):
    # Run an immediate job check
    background_tasks.add_task(check_all_jobs)
    return {"message": "Manual job check triggered!"}

def generate_job_hash(job):
    """Create a unique hash for a job based on its content."""
    job_string = f"{job['title']}|{job['company']}|{job['source']}"
    return hashlib.md5(job_string.encode()).hexdigest()

async def check_all_jobs():
    """Check all job sources for all configured keywords and locations."""
    global scraped_jobs
    global job_hashes
    
    new_jobs = []
    
    for source_name, source_config in JOB_SOURCES.items():
        for keyword in SEARCH_KEYWORDS:
            for location in SEARCH_LOCATIONS:
                try:
                    # Create the search URL with keyword and location
                    search_keyword = keyword.replace(" ", "+")
                    search_location = location.replace(" ", "+")
                    search_url = source_config["url"].replace("software+engineer", search_keyword)
                    if "&l=" in search_url:
                        search_url = search_url.replace("&l=", f"&l={search_location}")
                    
                    # Scrape jobs from this source
                    jobs = scrape_jobs(search_url, source_name, source_config)
                    
                    # Check for new jobs
                    for job in jobs:
                        job_hash = generate_job_hash(job)
                        if job_hash not in job_hashes:
                            # This is a new job
                            job_hashes.add(job_hash)
                            new_jobs.append(job)
                            # Add to our global list (prepend to show newest first)
                            scraped_jobs.insert(0, job)
                    
                    # Prevent the list from growing too large
                    if len(scraped_jobs) > 500:
                        scraped_jobs = scraped_jobs[:500]
                    
                    # Don't hammer the servers
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"Error checking jobs for {source_name} with keyword '{keyword}' in '{location}': {str(e)}")
    
    # Send notifications for new jobs
    if new_jobs:
        print(f"Found {len(new_jobs)} new jobs!")
        send_notifications(new_jobs)
    else:
        print("No new jobs found in this check.")

def scrape_jobs(url, source_name, source_config):
    """Scrape jobs from a specific source using its configuration."""
    jobs = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Find job cards using the source-specific selector
        job_cards = soup.select(source_config["card_selector"])
        
        for job in job_cards:
            try:
                # Extract job details using source-specific selectors
                title_elem = job.select_one(source_config["title_selector"])
                company_elem = job.select_one(source_config["company_selector"])
                link_elem = job.select_one(source_config["link_selector"])
                
                if title_elem and company_elem:
                    title = title_elem.text.strip()
                    company = company_elem.text.strip()
                    
                    # Get the job link
                    link = ""
                    if link_elem and link_elem.has_attr('href'):
                        link = link_elem['href']
                        # Add base URL if needed
                        if not link.startswith('http'):
                            link = source_config["base_url"] + link
                    else:
                        link = url
                    
                    # Get the post date if available
                    post_date = "Recent"
                    date_elem = job.select_one("span.date")
                    if date_elem:
                        post_date = date_elem.text.strip()
                    
                    jobs.append({
                        "title": title,
                        "company": company,
                        "link": link,
                        "source": source_name,
                        "post_date": post_date,
                        "keyword": url.split("q=")[1].split("&")[0].replace("+", " ") if "q=" in url else "",
                        "location": url.split("&l=")[1].split("&")[0].replace("+", " ") if "&l=" in url else "Not specified"
                    })
            except Exception as e:
                print(f"Error parsing job card in {source_name}: {str(e)}")
        
        print(f"Scraped {len(jobs)} jobs from {source_name} for {url}")
        return jobs
        
    except Exception as e:
        print(f"Error in scrape_jobs for {source_name}: {str(e)}")
        return []

def send_notifications(jobs):
    """Send notifications for new jobs."""
    if not jobs:
        return
    
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        for job in jobs:
            message_body = (
                f"New Job Alert: {job['title']} at {job['company']}\n"
                f"Location: {job['location']}\n"
                f"Source: {job['source']}\n"
                f"Apply here: {job['link']}"
            )
            
            # Uncomment when ready to send actual messages
            # message = client.messages.create(
            #     body=message_body,
            #     from_=TWILIO_PHONE_NUMBER,
            #     to=RECIPIENT_PHONE_NUMBER
            # )
            
            print(f"Would send notification: {message_body}")
    
    except Exception as e:
        print(f"Error sending notifications: {str(e)}")

# Create a scheduler to run the job check periodically
scheduler = BackgroundScheduler()
scheduler.add_job(check_all_jobs, 'interval', minutes=15)

@app.on_event("startup")
async def startup_event():
    # Start the scheduler on application startup
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    # Shut down the scheduler when the application shuts down
    scheduler.shutdown()