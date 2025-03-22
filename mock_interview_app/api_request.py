import os
import re
from dotenv import load_dotenv
import json
import logging
from typing import Dict, List, Optional, Union
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough


# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Groq model with LangChain
groq_api_key = os.getenv('GROQ_API_KEY')
model_name = os.getenv('MODEL_TYPE', 'llama3-8b-8192')  # Default model if not specified

# Define evaluation classes for consistency
CLASSIFICATIONS = {
    'Completely correct': 10,
    'Partially correct': 5,
    'Incorrect': 0
}

class EvaluationError(Exception):
    """Custom exception for evaluation errors."""
    pass

def get_llm() -> ChatGroq:
    """Initialize and return the Groq LLM with error handling."""
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY environment variable not set")
    
    try:
        return ChatGroq(
            api_key=groq_api_key,
            model_name=model_name,
            temperature=0.2,  # Reduced temperature for more deterministic evaluations
            max_tokens=1024
        )
    except Exception as e:
        logger.error(f"Failed to initialize Groq LLM: {e}")
        raise

def is_dont_know_answer(answer: str) -> bool:
    """Check if an answer indicates the candidate doesn't know.
    
    Args:
        answer: The candidate's answer text
        
    Returns:
        bool: True if answer indicates lack of knowledge
    """
    if not answer:
        return True
        
    answer_lower = answer.lower().strip()
    dont_know_phrases = [
        "i don't know", "i donot know", "don't know", "no idea", 
        "i am sorry", "i'm sorry", "not sure", "cannot answer", 
        "can't answer", "unable to answer"
    ]
    return any(phrase in answer_lower for phrase in dont_know_phrases)

def calculate_percentage(result_list: List[str], marking: Dict[str, int]) -> int:
    """Calculate percentage score based on evaluation results.
    
    Args:
        result_list: List of evaluation classifications
        marking: Dictionary mapping classifications to point values
        
    Returns:
        int: Percentage score rounded to nearest 10%
    """
    if not result_list:
        logger.warning("Empty result list, returning 0")
        return 0
    
    total_points = 0
    max_points = 0

    for result in result_list:
        if result in marking:
            total_points += marking[result]
            max_points += marking['Completely correct']
        else:
            logger.warning(f"Unknown classification: {result}")

    if max_points == 0:
        logger.warning("No valid classifications found, returning 0")
        return 0
        
    percentage = (total_points / max_points) * 100
    rounded_percentage = int((percentage // 10) * 10)
    
    logger.info(f"Raw score: {percentage:.2f}%, Rounded: {rounded_percentage}%")
    return rounded_percentage

def load_prompt_template(filename: str) -> str:
    """Load prompt template from file with robust path handling.
    
    Args:
        filename: Name of the prompt template file
        
    Returns:
        str: Content of the prompt template file
    """
    possible_paths = [
        filename,
        os.path.join("GeminiAPI", filename),
        os.path.join(os.path.dirname(__file__), filename)
    ]
    
    for path in possible_paths:
        try:
            with open(path, "r") as file:
                return file.read()
        except FileNotFoundError:
            continue
    
    raise FileNotFoundError(f"Could not find prompt template: {filename}")

def prepare_prompt(resume: str, tech_stack: str, difficulty: Union[int, str], 
                  question_count: Union[int, str]) -> str:
    """Prepare prompt for generating interview questions.
    
    Args:
        resume: Candidate's resume text
        tech_stack: Technologies to focus on
        difficulty: Difficulty level (1-5)
        question_count: Number of questions to generate
        
    Returns:
        str: Formatted prompt
    """
    try:
        prompt_template = load_prompt_template("prompt_question.txt")
    except FileNotFoundError as e:
        logger.error(f"Failed to load question prompt template: {e}")
        raise
    
    # Validate inputs
    if not resume or not tech_stack:
        raise ValueError("Resume and tech stack must not be empty")
    
    try:
        difficulty = int(difficulty)
        if not 1 <= difficulty <= 5:
            raise ValueError("Difficulty must be between 1 and 5")
    except ValueError:
        logger.warning(f"Invalid difficulty value: {difficulty}, defaulting to 3")
        difficulty = 3
        
    try:
        question_count = int(question_count)
        if not 1 <= question_count <= 20:
            raise ValueError("Question count must be between 1 and 20")
    except ValueError:
        logger.warning(f"Invalid question count: {question_count}, defaulting to 5")
        question_count = 5

    # Create a LangChain prompt template
    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["resume", "tech_stack", "difficulty", "question_count"]
    )
    
    return prompt.format(
        resume=resume,
        tech_stack=tech_stack,
        difficulty=str(difficulty),
        question_count=str(question_count)
    )

def prepare_prompt_for_answercheck(question_answer_pair: Dict[str, str]) -> str:
    """Prepare prompt for checking answers to interview questions.
    
    Args:
        question_answer_pair: Dictionary mapping questions to answers
        
    Returns:
        str: Formatted prompt for answer evaluation
    """
    if not question_answer_pair:
        raise ValueError("Question-answer pairs cannot be empty")
    
    # Default evaluation prompt template if file loading fails
    default_prompt_template = """You are an expert technical interviewer evaluating candidate responses to interview questions.

Your task is to evaluate the following question-answer pairs based on technical accuracy, completeness, and clarity.

For each answer, you must classify it as one of the following:
- "Completely correct": The answer is accurate, comprehensive, and demonstrates deep understanding.
- "Partially correct": The answer has some correct elements but contains inaccuracies or is incomplete.
- "Incorrect": The answer is wrong, irrelevant, or demonstrates fundamental misunderstanding.

IMPORTANT: Responses like "I don't know" or "I am sorry" or "No idea" MUST always be classified as "Incorrect".

Here are the question-answer pairs to evaluate:

{qa_pairs}

For each answer, provide your classification in the following format:
Answer 1: [classification]
Answer 2: [classification]
...

Be strict and objective in your assessment."""
    
    try:
        prompt_template = load_prompt_template("prompt_evaluation.txt")
    except FileNotFoundError as e:
        logger.warning(f"Failed to load evaluation prompt template: {e}. Using built-in template.")
        prompt_template = default_prompt_template
    
    # Format the question-answer pairs for the prompt
    qa_formatted = ""
    answer_num = 1
    for question, answer in question_answer_pair.items():
        if not question.strip():
            logger.warning(f"Skipping empty question: '{question}'")
            continue
            
        # Use empty string if answer is None
        answer_text = answer.strip() if answer else ""
        qa_formatted += f"Question {answer_num}: {question}\nAnswer {answer_num}: {answer_text}\n\n"
        answer_num += 1
    
    if not qa_formatted:
        raise ValueError("No valid question-answer pairs provided")
    
    # Create and format the prompt
    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["qa_pairs"]
    )
    
    return prompt.format(qa_pairs=qa_formatted)

def get_questions(prompt: str) -> List[str]:
    """Generate interview questions based on the prompt.
    
    Args:
        prompt: Formatted prompt for question generation
        
    Returns:
        List[str]: Generated interview questions
    """
    try:
        llm = get_llm()
        
        # Create a prompt that will format the output correctly
        questions_prompt = PromptTemplate(
            template=prompt + "\n\nSeparate each question with 'QQQ'. Don't include any newlines in the questions.",
            input_variables=[]
        )
        
        # Use the modern pipe syntax
        chain = questions_prompt | llm
        response = chain.invoke({})
        
        # Extract the content from the AIMessage object
        response_text = response.content
        
        # Process the response
        questions = response_text.split('QQQ')
        questions = [question.strip() for question in questions if question.strip()]
        
        if not questions:
            logger.warning("No questions were generated")
            return []
        
        logger.info(f"Generated {len(questions)} questions")
        return questions
    except Exception as e:
        logger.error(f"Error generating questions: {e}")
        raise

def get_evaluation(prompt: str, qa_pairs: Dict[str, str]) -> int:
    """Evaluate answers to interview questions and return a score.
    
    Args:
        prompt: Formatted prompt for answer evaluation
        qa_pairs: Dictionary of question-answer pairs being evaluated
        
    Returns:
        int: Percentage score (0-100, rounded to nearest 10)
    """
    try:
        # Pre-check for "I don't know" answers
        dont_know_count = sum(1 for answer in qa_pairs.values() if is_dont_know_answer(answer))
        total_answers = len(qa_pairs)
        
        # If most answers are "don't know" type, return a low score immediately
        if dont_know_count >= total_answers * 0.7 and total_answers > 0:
            logger.info(f"Most answers ({dont_know_count}/{total_answers}) indicate lack of knowledge. Returning low score.")
            return 10
        
        llm = get_llm()
        
        # Improved prompt with explicit formatting instructions
        evaluation_prompt = PromptTemplate(
            template=prompt + """\n\n
IMPORTANT INSTRUCTIONS:
1. For each answer, classify it as EXACTLY ONE of these options:
   - "Completely correct"
   - "Partially correct" 
   - "Incorrect"

2. Any answer resembling "I don't know" or "Sorry" MUST be classified as "Incorrect"

3. Format your response as follows:
   Answer 1: [classification]
   Answer 2: [classification]
   ...

4. Do not include additional explanations or commentary.

Remember to be strict in your evaluation and only use the three classification options.
""",
            input_variables=[]
        )
        
        chain = evaluation_prompt | llm
        response = chain.invoke({})
        
        # Extract the content from the AIMessage object
        response_text = response.content
        
        # Log the raw response for debugging
        logger.debug(f"Raw model response: {response_text}")
        
        # Try to extract classifications using regex pattern first
        processed_evaluations = []
        pattern = r"Answer\s+\d+:\s+(Completely correct|Partially correct|Incorrect)"
        matches = re.findall(pattern, response_text, re.IGNORECASE)
        
        if matches:
            logger.info(f"Found {len(matches)} classifications using regex")
            for match in matches:
                if re.search(r'completely\s+correct', match, re.IGNORECASE):
                    processed_evaluations.append("Completely correct")
                elif re.search(r'partially\s+correct', match, re.IGNORECASE):
                    processed_evaluations.append("Partially correct")
                else:
                    processed_evaluations.append("Incorrect")
        else:
            # Fallback to simpler parsing if regex doesn't find matches
            logger.warning("Regex pattern didn't find matches, falling back to simpler parsing")
            raw_evaluations = response_text.split('QQQ')
            if len(raw_evaluations) == 1:
                # Try splitting by newlines if QQQ separator not found
                raw_evaluations = [line.strip() for line in response_text.splitlines() if line.strip()]
            
            for eval_result in raw_evaluations:
                eval_text = eval_result.strip().lower()
                
                if "completely correct" in eval_text:
                    processed_evaluations.append("Completely correct")
                elif "partially correct" in eval_text:
                    processed_evaluations.append("Partially correct")
                elif "incorrect" in eval_text:
                    processed_evaluations.append("Incorrect")
                else:
                    # Skip lines that don't contain a classification
                    continue
        
        logger.info(f"Processed evaluations: {processed_evaluations}")
        
        # Handle mismatch between number of questions and evaluations
        if len(processed_evaluations) != len(qa_pairs):
            logger.warning(f"Number of evaluations ({len(processed_evaluations)}) doesn't match number of QA pairs ({len(qa_pairs)})")
            
            # If we have more evaluations than questions, trim the list
            if len(processed_evaluations) > len(qa_pairs):
                processed_evaluations = processed_evaluations[:len(qa_pairs)]
            # If we have fewer evaluations than questions, mark the remaining as incorrect
            else:
                processed_evaluations.extend(["Incorrect"] * (len(qa_pairs) - len(processed_evaluations)))
        
        # Override evaluations for "I don't know" answers
        final_evaluations = []
        answer_index = 0
        for _, answer in qa_pairs.items():
            if answer_index < len(processed_evaluations):
                if is_dont_know_answer(answer):
                    final_evaluations.append("Incorrect")
                    logger.info(f"Overriding evaluation for 'I don't know' type answer to 'Incorrect'")
                else:
                    final_evaluations.append(processed_evaluations[answer_index])
            answer_index += 1
        
        if not final_evaluations:
            logger.warning("No valid evaluations found in model response")
            return 0
        
        score = calculate_percentage(final_evaluations, CLASSIFICATIONS)
        
        # Apply penalty for "I don't know" answers if score is suspiciously high
        if dont_know_count > 0 and score > 50:
            penalty_factor = (dont_know_count / total_answers) * 0.5
            adjusted_score = int(score * (1 - penalty_factor))
            logger.info(f"Applying penalty for {dont_know_count} 'I don't know' answers. Original score: {score}, Adjusted: {adjusted_score}")
            score = adjusted_score
            # Round to nearest 10
            score = int((score // 10) * 10)
        
        return score
    except Exception as e:
        logger.error(f"Error evaluating answers: {e}")
        raise EvaluationError(f"Failed to evaluate answers: {str(e)}")

def evaluate_candidate(resume: str, tech_stack: str, difficulty: int, 
                      question_count: int, answers: Dict[str, str]) -> Dict:
    """Complete end-to-end evaluation of candidate answers.
    
    Args:
        resume: Candidate's resume text
        tech_stack: Technologies to focus on
        difficulty: Difficulty level (1-5)
        question_count: Number of questions
        answers: Dictionary mapping questions to answers
        
    Returns:
        Dict: Evaluation results including score and feedback
    """
    try:
        # Quick check for empty or all "I don't know" answers
        valid_answers = 0
        dont_know_count = 0
        
        for question, answer in answers.items():
            if answer and answer.strip():
                valid_answers += 1
                if is_dont_know_answer(answer):
                    dont_know_count += 1
        
        # If no valid answers or all answers are "I don't know", return low score immediately
        if valid_answers == 0:
            logger.warning("No valid answers provided")
            return {
                "score": 0,
                "raw_score": 0,
                "feedback": "Unable to evaluate. No valid answers provided.",
                "evaluated_answers": 0,
                "status": "success"
            }
        elif dont_know_count == valid_answers:
            logger.info("All answers indicate lack of knowledge")
            return {
                "score": 0,
                "raw_score": 0,
                "feedback": "Poor performance. Candidate lacks fundamental understanding of the subject matter.",
                "evaluated_answers": valid_answers,
                "status": "success"
            }
            
        evaluation_prompt = prepare_prompt_for_answercheck(answers)
        score = get_evaluation(evaluation_prompt, answers)
        
        return {
            "score": score,
            "raw_score": score,
            "feedback": get_feedback_for_score(score),
            "evaluated_answers": valid_answers,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Evaluation failed: {e}")
        return {
            "score": None,
            "feedback": None,
            "error": str(e),
            "status": "error"
        }

def get_feedback_for_score(score: int) -> str:
    """Generate feedback based on the evaluation score.
    
    Args:
        score: Percentage score (0-100)
        
    Returns:
        str: Feedback message
    """
    if score >= 90:
        return "Excellent! Candidate demonstrated comprehensive knowledge."
    elif score >= 70:
        return "Good performance. Candidate shows solid understanding with some room for improvement."
    elif score >= 50:
        return "Adequate performance. Candidate has basic knowledge but needs development in some areas."
    elif score >= 30:
        return "Below average. Candidate needs significant improvement in key areas."
    else:
        return "Poor performance. Candidate lacks fundamental understanding of the subject matter."

if __name__ == "__main__":
    # Test the functionality
    logger.info("Testing Groq LangChain implementation...")
    
    try:
        # Test for "I don't know" type answers
        test_qa_dont_know = {
            'What is the difference between synchronous and asynchronous programming in JavaScript?': 'I don\'t know the answer to this question, sorry.'
        }
        
        logger.info("Testing evaluation of 'I don't know' answers...")
        prompt_dont_know = prepare_prompt_for_answercheck(test_qa_dont_know)
        score_dont_know = get_evaluation(prompt_dont_know, test_qa_dont_know)
        logger.info(f"Evaluation score for 'I don't know' answer: {score_dont_know}%")
        logger.info(f"Feedback: {get_feedback_for_score(score_dont_know)}")
        
        # Original test for comparison
        test_qa = {
            'What are the 3 primary colors in the RGB color model?': 'Red, Green, and Blue',
            'What is Python?': 'Python is a high-level, interpreted programming language known for its readability and versatility.',
            'Explain the concept of object-oriented programming.': 'Object-oriented programming is a paradigm where code is organized around objects rather than functions and logic. It uses classes and objects to structure code.'
        }
        
        prompt = prepare_prompt_for_answercheck(test_qa)
        logger.info("Prompt prepared successfully.")
        
        score = get_evaluation(prompt, test_qa)
        logger.info(f"Evaluation score: {score}%")
        logger.info(f"Feedback: {get_feedback_for_score(score)}")
        
        # Test with mixed responses
        test_qa_mixed = {
            'What are the 3 primary colors in the RGB color model?': 'Red, Green, and Blue',
            'What is Python?': 'I don\'t know',
            'Explain the concept of object-oriented programming.': 'Object-oriented programming is a paradigm where code is organized around objects rather than functions and logic. It uses classes and objects to structure code.'
        }
        
        prompt_mixed = prepare_prompt_for_answercheck(test_qa_mixed)
        score_mixed = get_evaluation(prompt_mixed, test_qa_mixed)
        logger.info(f"Evaluation score for mixed answers: {score_mixed}%")
        logger.info(f"Feedback: {get_feedback_for_score(score_mixed)}")
        
    except Exception as e:
        logger.error(f"Test failed: {e}")