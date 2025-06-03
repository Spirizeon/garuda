# GARUDA: Re-define Intern/Job applications through Generative AI

## Project Overview

This repository contains a **Resume Builder Application** designed to assist users in creating, updating, and managing resumes tailored to specific job descriptions. The application consists of two main components:

1. **Backend API**: We've Built using FastAPI and LangChain for intelligent resume generation.
2. **Frontend Application**: A React-based interface powered by Vite for seamless user interaction.

---

## Features

### Backend (FastAPI)
- **Resume Creation**: Generates resumes based on user profiles, job descriptions, and templates using LangChain's AI capabilities.
- **Resume Update**: Enhances existing resumes to better match job requirements.
- **Job Recommendations**: Fetches job listings from external APIs and categorizes them.
- **Interview Preparation Assistant**: Provides chatbot functionality for interview practice.

### Frontend (React + Vite)
- **Interactive UI**: Allows users to create, update, and view resumes.
- **Job Listings**: Displays job recommendations with filtering options.
- **Chatbot Integration**: Prepares users for interviews with an interactive assistant.
- **TailwindCSS Styling**: Ensures modern and responsive design.

---

## Installation

### Backend
1. Clone the repository:
   ```bash
   git clone 
   cd backend
   ```

2. Set up a virtual environment:
   ```bash
   python -m venv env
   source env/bin/activate  # On Windows use `env\Scripts\activate`
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the server:
   ```bash
   uvicorn final_endpoints:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend
1. Navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

---

## Usage

### Backend API Endpoints

#### Resume Management
- `POST /resume/create`: Create a new resume.
- `POST /resume/update`: Update an existing resume.

#### Job Recommendations
- `GET /jobs`: Fetch job listings.

#### Chatbot Interaction
- `POST /chat`: Send a message to the chatbot.

#### Health Check
- `GET /health`: Verify API health.

### Frontend Features
1. Open the application in your browser at `http://localhost:`.
2. Navigate between sections:
    - **Resumes**: View, create, or update resumes.
    - **Jobs**: Explore job recommendations.
    - **Chatbot**: Practice interview questions.

---

## Technologies Used

### Backend
- **FastAPI**: For building RESTful APIs.
- **LangChain**: For AI-driven resume generation.
- **Pydantic**: For data validation.
- **MongoDB/Ngrok Integration**: External API connections.

### Frontend
- **React + Vite**: Modern frontend framework with fast build times.
- **TailwindCSS**: Responsive styling.
- **Radix UI Components**: Advanced UI elements.
- **React Router DOM**: Navigation management.

---

## Development

### Backend Configuration
Environment variables are managed using `.env` files. Ensure you set up keys for external APIs (e.g., MongoDB, Ngrok).

### Frontend Configuration
TailwindCSS configuration is located in `tailwind.config.js`. Paths are defined in `jsconfig.json`.

---

## Testing

### Backend Tests
Run unit tests using:
```bash
pytest tests/
```

### Frontend Tests
Run React component tests using:
```bash
npm test
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](client/LICENSE) file for details.

---

## Contribution

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m "Add new feature"`).
4. Push to the branch (`git push origin feature-name`).
5. Submit a pull request.

