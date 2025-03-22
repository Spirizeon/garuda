import os
import json
import re
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException,APIRouter
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from dotenv import load_dotenv

# LangChain imports
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_groq import ChatGroq

# Load environment variables
load_dotenv()

router = APIRouter(
    prefix="/resume",
    tags=["resume"],
    responses={404: {"description": "Not found"}},
)
# Pydantic models
class ResumeCreateRequest(BaseModel):
    user_profile: Dict[str, Any]
    resume_template: Dict[str, Any]
    job_description: str

class ResumeUpdateRequest(BaseModel):
    previous_resume: Dict[str, Any]
    resume_template: Dict[str, Any]
    job_description: str
    user_query: str

class ResumeResponse(BaseModel):
    resume: Dict[str, Any]

# LangChain setup
def get_llm(model=None):
    """Get the language model based on provider."""
    return ChatGroq(
        model=model or "llama-3.3-70b-versatile",
        temperature=0.2,
        max_retries=2
    )

SYSTEM_PROMPT = """You are an expert resume builder agent designed to create tailored, professional resumes. Your task is to analyze job descriptions, match them with user profiles, and generate optimized resumes that follow specific templates.

GUIDELINES:
1. Carefully analyze the job description to identify key requirements, skills, and qualifications.
2. Review the user's profile to understand their experience, skills, education, and achievements.
3. Tailor the resume to highlight experiences and skills most relevant to the job description.
4. Use strong action verbs and quantify achievements whenever possible.
5. Follow the exact structure of the provided template.
6. Format the final output as valid JSON that matches the template structure.
7. Be concise, professional, and honest - do not invent information not present in the user's profile.
"""

UPDATE_SYSTEM_PROMPT = """You are an expert resume updater designed to improve existing resumes based on job descriptions and user queries. Your task is to analyze job descriptions, compare them with the existing resume, and update the resume to better match the job requirements.

GUIDELINES:
1. Carefully analyze the job description to identify key requirements, skills, and qualifications.
2. Review the existing resume to understand the user's experience, skills, education, and achievements.
3. Update the resume to highlight experiences and skills most relevant to the job description.
4. Address the specific user query or request for changes.
5. Follow the exact structure of the provided template.
6. Format the final output as valid JSON that matches the template structure.
7. Be concise, professional, and honest - do not invent information not present in the existing resume.
"""

def extract_json_from_text(text: str) -> Dict[str, Any]:
    """Extract JSON object from text with improved error handling."""
    # Find content between triple backticks
    json_match = re.search(r"``````", text, re.DOTALL)
    if json_match:
        json_str = json_match.group(1)
    else:
        # If no backticks, try to find JSON object directly
        json_match = re.search(r"(\{[\s\S]*\})", text)
        if json_match:
            json_str = json_match.group(1)
        else:
            # If still no match, use the whole text
            json_str = text
    
    # Clean up common JSON formatting errors
    json_str = re.sub(r',(\s*[\]}])', r'\1', json_str)  # Remove trailing commas
    
    try:
        # Try to parse the JSON
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        try:
            # Try using a more lenient JSON parser as fallback
            import json5
            return json5.loads(json_str)
        except:
            # If all parsing fails, return empty dict
            return {}

def validate_json_structure(json_data: Dict[str, Any], template: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and fix JSON structure against the template."""
    result = {}
    
    # Process each key in the template
    for key, value in template.items():
        if key not in json_data:
            # If key is missing in the generated JSON, use template value
            result[key] = value
        elif isinstance(value, list) and isinstance(json_data[key], list):
            # Handle list values
            result[key] = []
            for item in json_data[key]:
                if isinstance(item, dict):
                    # Validate each item against the template item
                    template_item = value[0] if len(value) > 0 else {}
                    valid_item = {k: item.get(k, v) for k, v in template_item.items()}
                    if any(v for v in valid_item.values()):  # Only add non-empty items
                        result[key].append(valid_item)
        elif isinstance(value, dict) and isinstance(json_data[key], dict):
            # Handle nested dictionaries
            result[key] = {k: json_data[key].get(k, v) for k, v in value.items()}
        else:
            # For simple values, use the generated value
            result[key] = json_data[key]
            
    return result

# API endpoints
@router.post("/create", response_model=ResumeResponse)
async def create_resume(request: ResumeCreateRequest):
    """Create a new resume based on user profile, job description, and template."""
    try:
        llm = get_llm()
        
        # Convert request data to strings for the prompt
        job_description = request.job_description
        user_profile_str = json.dumps(request.user_profile, indent=2)
        template_str = json.dumps(request.resume_template, indent=2)
        
        # Create messages for the LLM
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"""
            I need to create a resume for a job application. Here are the details:
            
            JOB DESCRIPTION:
            {job_description}
            
            MY PROFILE:
            {user_profile_str}
            
            RESUME TEMPLATE:
            {template_str}
            
            Please create a tailored resume that follows the exact structure of the template and highlights my relevant skills and experiences for this job. Return the result as a valid JSON object.
            """)
        ]
        
        # Get response from LLM
        response = llm.invoke(messages)
        
        # Extract and validate JSON
        resume_json = extract_json_from_text(response.content)
        if not resume_json:
            raise HTTPException(status_code=500, detail="Failed to generate valid resume JSON")
        
        # Validate against template
        validated_resume = validate_json_structure(resume_json, request.resume_template)
        
        return JSONResponse(content=jsonable_encoder({"resume": validated_resume}))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating resume: {str(e)}")

@router.post("/update", response_model=ResumeResponse)
async def update_resume(request: ResumeUpdateRequest):
    """Update an existing resume based on job description and user query."""
    try:
        llm = get_llm()
        
        # Convert request data to strings for the prompt
        job_description = request.job_description
        previous_resume_str = json.dumps(request.previous_resume, indent=2)
        template_str = json.dumps(request.resume_template, indent=2)
        user_query = request.user_query
        
        # Create messages for the LLM
        messages = [
            SystemMessage(content=UPDATE_SYSTEM_PROMPT),
            HumanMessage(content=f"""
            I need to update my resume for a job application. Here are the details:
            
            JOB DESCRIPTION:
            {job_description}
            
            MY CURRENT RESUME:
            {previous_resume_str}
            
            RESUME TEMPLATE:
            {template_str}
            
            MY REQUEST:
            {user_query}
            
            Please update my resume to better match the job description and address my specific request. Return the updated resume as a valid JSON object that follows the exact structure of the template.
            """)
        ]
        
        # Get response from LLM
        response = llm.invoke(messages)
        
        # Extract and validate JSON
        updated_resume_json = extract_json_from_text(response.content)
        if not updated_resume_json:
            raise HTTPException(status_code=500, detail="Failed to generate valid updated resume JSON")
        
        # Validate against template
        validated_resume = validate_json_structure(updated_resume_json, request.resume_template)
        
        return JSONResponse(content=jsonable_encoder({"resume": validated_resume}))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating resume: {str(e)}")


