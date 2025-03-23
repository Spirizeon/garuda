import { useState, useEffect, useRef } from 'react';
import resumeData from './resumeData.json';
import profile from './profile.json'

export default function ChatInterface({ onResumeData }) {
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your resume builder assistant. Please enter the job role you're applying for:", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState('job-role'); // ['job-role', 'job-description', 'analyzing', 'complete']
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (stage === 'job-role') {
        setJobRole(input);
        setStage('job-description');
        setMessages(prev => [
          ...prev,
          { text: `Great! Now please paste the job description:`, sender: 'bot' }
        ]);
      } else if (stage === 'job-description') {
        setJobDescription(input);
        setStage('analyzing');
        
        // Add a message to show that the system is processing
        setMessages(prev => [
          ...prev,
          { text: `Thanks! Analyzing your profile for a ${jobRole} position...`, sender: 'bot' }
        ]);
        
        // Make API call to generate the resume
        fetchCustomizedResume(jobRole, input);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      setMessages(prev => [
        ...prev,
        { text: 'Sorry, there was an error processing your request. Please try again.', sender: 'bot' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomizedResume = async (role, description) => {
    try {
      setIsLoading(true);
      
      // Prepare request payload according to the API documentation
      const payload = {
        user_profile: profile,
        resume_template: resumeData,
        job_description: description
      };
      
      // Make the API call
      const response = await fetch('/api/resume/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }
      
      // Parse the response - according to docs it should have a "resume" property
      const responseData = await response.json();
      
      // Log the entire response
      console.log("API Response:", responseData);
      
      // Extract the resume data from the response
      const customizedResumeData = responseData.resume;
      console.log("Customized Resume Data:", customizedResumeData);
      
      // Update messages to reflect success
      setMessages(prev => [
        ...prev,
        { text: `Identifying relevant skills for this position...`, sender: 'bot' },
        { text: `I found ${customizedResumeData.skills?.length || 0} relevant skills for this position.`, sender: 'bot' },
        { text: `Identifying relevant projects for this position...`, sender: 'bot' },
        { text: `I found ${customizedResumeData.projects?.length || 0} relevant projects for this position.`, sender: 'bot' },
        { text: `Identifying relevant work experience...`, sender: 'bot' },
        { text: `I found ${customizedResumeData.workEx?.length || 0} relevant work experiences for this position.`, sender: 'bot' },
        { text: `Generating a tailored summary for your resume...`, sender: 'bot' },
        { text: `Your resume is ready! I've created a tailored resume that highlights your relevant skills and experience for this ${role} position. You can view it in the preview panel and download it as a PDF.`, sender: 'bot' }
      ]);
      
      // Pass the customized resume data to the parent component
      onResumeData(customizedResumeData);
      
      // Mark process as complete
      setStage('complete');
    } catch (error) {
      console.error('Error fetching customized resume:', error);
      setMessages(prev => [
        ...prev,
        { text: 'Sorry, there was an error generating your customized resume. Please try again.', sender: 'bot' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-800">
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          Resume Assistant
        </h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-gray-900 chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              message.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-gray-800 text-gray-200 rounded-bl-none'
            }`}>
              {message.text}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-800 text-gray-300 p-3 rounded-lg rounded-bl-none max-w-[80%]">
              <div className="flex items-center">
                <div className="typing-indicator-dot mr-1"></div>
                <div className="typing-indicator-dot mr-1"></div>
                <div className="typing-indicator-dot"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="bg-gray-800 border-t border-gray-700 p-3 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading || stage === 'complete'}
          className="flex-1 bg-gray-700 text-white rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim() || stage === 'complete'}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </form>
      
      <style jsx>{`
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: #1f2937;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background-color: #4b5563;
          border-radius: 20px;
        }
        .typing-indicator-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #a0aec0;
          animation: pulse 1.4s infinite ease-in-out;
        }
        .typing-indicator-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-indicator-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes pulse {
          0%, 60%, 100% { transform: scale(1); opacity: 1; }
          30% { transform: scale(1.5); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
