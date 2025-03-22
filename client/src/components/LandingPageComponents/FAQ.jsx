import React, { useState } from "react";

const faqs = [
    {
        question: "How does Garuda create tailored resumes and cover letters?",
        answer:
            "Garuda uses AI to analyze your profile and the job description, selecting the most relevant projects, skills, and experiences to craft professional resumes and cover letters.",
    },
    {
        question: "Can I customize what information is included in my portfolio?",
        answer:
            "Yes! Garuda's portfolio API allows you to control what data gets reflected, giving you full flexibility and personalization.",
    },
    {
        question: "What types of interview questions does Garuda provide?",
        answer:
            "Garuda provides job-specific DSA questions, technical interview questions, and behavioral questions curated using AI and real-world trends.",
    },
    {
        question: "Is my data secure with Garuda?",
        answer:
            "Absolutely! We prioritize your data privacy and security, ensuring all personal information is stored and managed with top-notch encryption protocols.",
    },
    {
        question: "How quickly can I create a resume for a job posting?",
        answer:
            "With Garuda, you can create a fully tailored resume and cover letter in just 1-2 minutes by simply pasting the job title, description, and company name!",
    },
];

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index); // Toggle the open state
    };

    return (
        <div className="w-full px-4 md:px-8 py-10 md:py-20 bg-black">
            <div className="py-4 mb-4 flex flex-col items-center">
                <h2 className="text-3xl md:text-5xl font-bold text-white">
                    Frequently Asked <span className="text-green-500">Questions</span>
                </h2>
            </div>
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div
                        key={index}
                        className="border border-gray-700 rounded-lg p-4"
                    >
                        <button
                            onClick={() => toggleFAQ(index)}
                            className="w-full text-left text-lg font-semibold text-white flex justify-between items-center"
                        >
                            {faq.question}
                            <span className="ml-2 text-gray-400">
                                {openIndex === index ? "-" : "+"}
                            </span>
                        </button>
                        {/* Conditionally render the answer */}
                        {openIndex === index && (
                            <p className="mt-2 text-sm text-gray-400">{faq.answer}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQ;