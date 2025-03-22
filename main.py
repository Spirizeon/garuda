import logging
from fastapi import FastAPI, HTTPException
import uvicorn

# Import the router
from routers.mock_interview_routes import router as candidate_router
from routers.resume_routers import router as resume_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create the FastAPI app
app = FastAPI(
    title="Candidate Evaluation API",
    description="API for generating interview questions and evaluating candidate answers",
    version="1.0.0"
)

# Include the candidate router
app.include_router(candidate_router)
app.include_router(resume_router)

# Add a simple root endpoint for API health check
@app.get("/", response_description="API Status")
async def root():
    return {"status": "online", "message": "Candidate Evaluation API is running"}

# Run the application if executed directly
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)