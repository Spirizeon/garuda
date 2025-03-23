from fastapi import FastAPI, UploadFile, File, HTTPException, APIRouter
from pydantic import BaseModel
import json
from groq import Client
from PyPDF2 import PdfReader
import requests
import traceback
import io
import re
from dotenv import load_dotenv
import os

# Initialize router
router = APIRouter()
load_dotenv()

# Initialize Groq client
client = Client(api_key=os.getenv("GROQ_API_KEY"))  # Replace with your Groq API key
SERPAPI_KEY = os.getenv("SERPAPI_KEY")


# Pydantic model for request body
class LocationRequest(BaseModel):
    location: str
    num_companies: int

# Function to extract text from PDF
def extract_text_from_pdf(pdf_file):
    try:
        # Reset file pointer to beginning
        pdf_file.seek(0)
        
        # Read the file into a BytesIO object
        pdf_bytes = io.BytesIO(pdf_file.read())
        
        try:
            reader = PdfReader(pdf_bytes)
            text = ""
            for page in reader.pages:
                try:
                    page_text = page.extract_text() or ""
                    text += page_text
                except Exception as e:
                    print(f"Error extracting text from page: {str(e)}")
                    continue  # Skip problematic pages
            
            # Clean the extracted text to remove problematic characters
            text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]', '', text)
            
            if not text.strip():
                raise HTTPException(status_code=400, detail="No readable text found in PDF")
                
            return text.strip()
        except Exception as e:
            # Try an alternative approach for problematic PDFs
            pdf_file.seek(0)
            reader = PdfReader(pdf_file)
            text = ""
            for i in range(len(reader.pages)):
                try:
                    page = reader.pages[i]
                    page_text = page.extract_text() or ""
                    text += page_text
                except:
                    continue
            
            if not text.strip():
                raise HTTPException(status_code=400, detail="Could not extract text from PDF with any method")
                
            return text.strip()
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")

# Function to fetch job listings using SerpAPI
def fetch_jobs_with_serpapi(skills, location, max_jobs):
    try:
        # Use fallback if skills is empty or None
        if not skills or skills.strip() == "":
            skills = "software engineer"
            
        query = f"software engineer {skills}"
        params = {
            "engine": "google_jobs",
            "q": query,
            "hl": "en",
            "api_key": SERPAPI_KEY,
            "location": location,
            "chips": "country:india" if location.lower() == "india" else None,
            "num": max_jobs
        }
        
        response = requests.get("https://serpapi.com/search", params=params)
        response.raise_for_status()
        
        data = response.json()
        jobs = data.get("jobs_results", [])
        
        if not jobs:
            # Fallback to broader search if no results
            broader_query = "software engineer"
            params["q"] = broader_query
            response = requests.get("https://serpapi.com/search", params=params)
            response.raise_for_status()
            data = response.json()
            jobs = data.get("jobs_results", [])
        
        job_listings = []
        for job in jobs[:max_jobs]:
            apply_link = "#"
            company_link = "#"
            related_links = job.get("related_links", [])
            for link in related_links:
                url = link.get("link", "")
                if any(keyword in url.lower() for keyword in ["apply", "careers", "indeed.com", "linkedin.com", "jobs", "career"]):
                    apply_link = url
                if any(keyword in url.lower() for keyword in ["company", "about", "linkedin.com/company", job.get("company_name", "").lower()]):
                    company_link = url
            
            if apply_link == "#":
                job_title = job.get("title", "software engineer").replace(" ", "+")
                company = job.get("company_name", "").replace(" ", "+")
                apply_link = f"https://www.indeed.com/jobs?q={job_title}+{company}&l={location.replace(' ', '+')}"
            
            if company_link == "#":
                company = job.get("company_name", "").replace(" ", "+")
                company_link = f"https://www.google.com/search?q={company}+official+website"

            job_listings.append({
                "job_role": job.get("title", "N/A"),
                "company_name": job.get("company_name", "N/A"),
                "apply_link": apply_link,
                "company_link": company_link
            })
        
        return job_listings
    
    except Exception as e:
        print(f"Error fetching jobs: {str(e)}")
        # Return minimal job listings as fallback
        return [
            {
                "job_role": "Software Engineer",
                "company_name": "Tech Company",
                "apply_link": f"https://www.indeed.com/jobs?q=Software+Engineer&l={location.replace(' ', '+')}",
                "company_link": "https://www.google.com/search?q=tech+companies"
            }
        ]

# Function to analyze resume with Groq and fetch jobs
def analyze_resume_with_groq(resume_text, location, num_companies):
    try:
        # Handle empty resume text
        if not resume_text or resume_text.strip() == "":
            raise HTTPException(status_code=400, detail="Empty resume text")
            
        # Limit resume text length to avoid token limits
        max_chars = 12000  # ~3000 tokens
        if len(resume_text) > max_chars:
            resume_text = resume_text[:max_chars]
        
        # Step 1: Analyze the resume
        resume_analysis_prompt = (
            "You are a professional resume analyzer. Extract skills, experience, education, and any other relevant details "
            "from the following resume text. Return the analysis as a JSON object with these fields: "
            "'skills' (array of strings), 'experience' (array of objects with company, role, duration), "
            "'education' (array of objects with institution, degree, year), 'summary' (string). "
            "If any fields cannot be determined, include them as empty arrays or strings."
        )
        
        try:
            resume_analysis_response = client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system", "content": resume_analysis_prompt},
                    {"role": "user", "content": resume_text}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            resume_analysis_content = resume_analysis_response.choices[0].message.content
            try:
                resume_analysis = json.loads(resume_analysis_content)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                print("JSON parsing failed for content:", resume_analysis_content)
                resume_analysis = {"skills": ["software engineer"], "experience": [], "education": [], "summary": ""}
        except Exception as e:
            print(f"Groq API error: {str(e)}")
            # Fallback if Groq API fails
            resume_analysis = {"skills": ["software engineer"], "experience": [], "education": [], "summary": ""}
        
        # Step 2: Fetch job listings
        skills_list = resume_analysis.get("skills", ["software engineer"])
        # Make sure skills is a list and contains strings only
        if not isinstance(skills_list, list):
            skills_list = ["software engineer"]
        skills_list = [str(skill) for skill in skills_list if skill]
        
        skills = " ".join(skills_list) if skills_list else "software engineer"
        job_listings = fetch_jobs_with_serpapi(skills, location, num_companies)
        
        return {
            "success": True,
            "analysis": resume_analysis,
            "jobs": job_listings
        }
    
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        print(f"Error analyzing resume with Groq: {str(e)}")
        print(traceback.format_exc())
        
        # Fallback to minimal job listings
        fallback_jobs = fetch_jobs_with_serpapi("software engineer", location, num_companies)
        return {
            "success": True,
            "analysis": {"skills": ["software engineer"], "experience": [], "education": [], "summary": ""},
            "jobs": fallback_jobs
        }

# Routes
@router.post("/analyze-resume/")
async def analyze_resume(file: UploadFile = File(...), location: str = "India", num_companies: int = 7):
    """
    Endpoint to upload a PDF resume and get job listings.
    Returns job role, company name, apply link, and company link.
    """
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Extract text from PDF
        resume_text = extract_text_from_pdf(file.file)
        
        # Process resume and get job listings
        result = analyze_resume_with_groq(resume_text, location, num_companies)
        
        if result["success"]:
            return {
                "jobs": result["jobs"]
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to process resume or fetch jobs")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        print(traceback.format_exc())
        
        # Return fallback response
        return {
            "jobs": [
                {
                    "job_role": "Software Engineer",
                    "company_name": "Tech Company",
                    "apply_link": f"https://www.indeed.com/jobs?q=Software+Engineer&l={location.replace(' ', '+')}",
                    "company_link": "https://www.google.com/search?q=tech+companies"
                }
            ]
        }