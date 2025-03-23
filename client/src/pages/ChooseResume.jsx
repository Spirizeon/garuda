import React from 'react'
import ResumeCards from '@/components/ChooseResume/ResumeCards'
import Topbar from '@/components/Topbar'

const ChooseResume = () => {
  // Resume type data
  const resumeTypes = [
    {
      title: "Developer Resume",
      description: "Perfect for software engineers, web developers, and tech professionals. Highlights technical skills, coding projects, and development experience with a focus on technologies and programming languages.",
      imageSrc: "https://cdn.pixabay.com/photo/2018/05/08/08/44/artificial-intelligence-3382507_960_720.jpg",
      type: "Developer"
    },
    {
      title: "Researcher Resume",
      description: "Designed for academics, scientists, and research professionals. Emphasizes publications, research methodology, academic achievements, and specialized knowledge in your field of study.",
      imageSrc: "https://cdn.pixabay.com/photo/2018/02/23/04/38/laptop-3174729_960_720.jpg",
      type: "Researcher"
    },
    {
      title: "Balanced Resume",
      description: "A versatile template suitable for all professions. Provides equal emphasis on skills, work experience, and educational background, making it perfect for career changers and generalists.",
      imageSrc: "https://cdn.pixabay.com/photo/2017/10/10/21/47/laptop-2838921_960_720.jpg",
      type: "Balanced"
    }
  ];

  return (
    <>
    <Topbar/>

    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl mb-4">
            Choose Your Resume Template
          </h1>
          <p className="text-xl text-gray-300">
            Select the template that best matches your career profile
          </p>
        </div>
        
        <div className="space-y-8">
          {resumeTypes.map((resume, index) => (
            <ResumeCards 
              key={index}
              title={resume.title}
              description={resume.description}
              imageSrc={resume.imageSrc}
              type={resume.type}
            />
          ))}
        </div>
      </div>
    </div>
    </>
  )
}

export default ChooseResume
