import { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import resumeData from './resumeData.json';

export default function ResumePreview({ data = resumeData }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [latexCode, setLatexCode] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfIframeRef = useRef(null);

  // Clear PDF URL when unmounting to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Generate PDF when data is available
  useEffect(() => {
    if (data) {
      generatePdf();
      generateLatexCode();
    }
  }, [data]);

  // Format date from ISO string to readable format (Month Year)
  const formatDate = (dateString) => {
    if (!dateString) return "Present";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  // Generate LaTeX code from data
  const generateLatexCode = () => {
    // Skills as comma-separated list
    const skillsList = data.skills.join(', ');
    
    // Work experience entries
    let workExEntries = '';
    data.workEx.forEach(exp => {
      workExEntries += `
\\resumeentry
{${exp.position} at ${exp.company}}
{${formatDate(exp.startDate)} - ${exp.isCurrent ? 'Present' : formatDate(exp.endDate)}}
{${exp.description}}

`;
    });
    
    // Project entries
    let projectEntries = '';
    data.projects.forEach(project => {
      const technologies = project.technologiesUsed.join(', ');
      projectEntries += `
\\resumeentry
{${project.title} \\quad \\href{${project.projectLink}}{\\faGithub}}
{${formatDate(project.startDate)} - ${formatDate(project.endDate)}}
{Technologies: ${technologies}}
{${project.description}}

`;
    });
    
    // Certification entries
    let certEntries = '';
    data.certifications.forEach(cert => {
      certEntries += `
\\resumeentry
{${cert.name} \\hfill \\href{${cert.credentialURL}}{\\faExternalLink\\ Verify Credential}}
{${formatDate(cert.issueDate)} - ${formatDate(cert.expirationDate)}}
{${cert.issuingOrganization}}

`;
    });
    
    // Achievement entries
    let achievementItems = '';
    data.achievements.forEach(achievement => {
      achievementItems += `    \\item \\textbf{${achievement.title}} (${formatDate(achievement.date)}): ${achievement.description}\n`;
    });
    
    // Education entries
    let educationEntries = '';
    data.academic.forEach(edu => {
      educationEntries += `
\\resumeentry
{${edu.degree} in ${edu.fieldOfStudy}, ${edu.institution}}
{${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}}
{Grade: ${edu.grade}}
{${edu.description}}

`;
    });
    
    // Complete LaTeX document
    const latex = `\\documentclass[letterpaper,11pt]{article}

\\usepackage[empty]{fullpage}
\\usepackage{xcolor}
\\usepackage{geometry}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fontawesome5}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{xparse}
\\usepackage{tabularx}

% Document settings
\\geometry{left=0.6in,right=0.6in,top=0.5in,bottom=0.5in}
\\pagestyle{empty}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0pt}
\\setlength{\\parindent}{0pt}

% Define custom colors
\\definecolor{primary}{RGB}{52, 73, 94}   % Dark blue-gray (primary color)
\\definecolor{accent}{RGB}{41, 128, 185}  % Blue (accent color)
\\definecolor{heading}{RGB}{44, 62, 80}   % Darker blue-gray for headings
\\definecolor{subheading}{RGB}{52, 73, 94} % Same as primary for subheadings
\\definecolor{sectionline}{RGB}{211, 211, 211} % Light gray for section lines
\\definecolor{bodytext}{RGB}{50, 50, 50}  % Dark gray for body text

% Section formatting
\\titleformat{\\section}
  {\\color{heading}\\scshape\\Large}
  {}{0em}
  {}
  [{\\color{sectionline}\\titlerule[0.8pt]}]
\\titlespacing*{\\section}{0pt}{10pt}{6pt}

% Subsection formatting
\\titleformat{\\subsection}
  {\\color{subheading}\\bfseries}
  {}{0em}
  {}
\\titlespacing*{\\subsection}{0pt}{5pt}{0pt}

% Name and contact at the top
\\newcommand{\\name}[1]{{\\Huge\\bfseries\\color{primary}#1}\\vspace{2pt}}
\\newcommand{\\contact}[5]{
 \\begin{center}
    \\begin{tabular}{c c c c}
        \\href{mailto:#1}{\\faEnvelope\\ #1} \\hspace{1cm} &
        \\href{#3}{\\faGlobe\\ #2} \\hspace{1cm} &
        \\href{#4}{\\faLinkedin\\ #3} \\hspace{1cm} &
        \\href{#5}{\\faGithub\\ #4}
    \\end{tabular}
\\end{center}

    \\vspace{-8pt}
}

% Command for entries with dates on the right
\\newcommand{\\datedentry}[2]{
  \\noindent\\begin{tabularx}{\\textwidth}{X r}
    {\\bfseries#1} & {\\color{accent}\\small#2} \\\\
  \\end{tabularx}
}

% Command for entries with organization and date
\\newcommand{\\resumeentry}[4]{
  \\datedentry{#1}{#2}
  {\\itshape#3}\\\\
  #4\\vspace{6pt}
}

% Skills with bullet points
\\newcommand{\\skills}[2]{
  \\textbf{#1}: #2 \\\\
}

\\begin{document}
\\color{bodytext}

% Header with name and title
\\begin{center}
  \\name{${data.personalInfo.firstName} ${data.personalInfo.lastName}}\\\\
  \\vspace{1pt}
  {\\large\\itshape Software Engineer}
\\end{center}

% Contact information
\\contact{${data.personalInfo.email}}{${data.personalInfo.phone}}{${data.socials.website || 'maheep.dev'}}{${data.socials.linkedIn.replace('https://www.linkedin.com/in/', '')}}{${data.socials.github.replace('https://github.com/', '')}}


% Work Experience
\\section{Professional Experience}

${workExEntries}

% Projects
\\section{Projects}

${projectEntries}

\\section{Certifications}

${certEntries}

% Skills section
\\section{Technical Skills}
${skillsList}


% Achievements
\\section{Achievements}
\\begin{itemize}[leftmargin=15pt, itemsep=2pt]
${achievementItems}
\\end{itemize}

% Education
\\section{Education}

${educationEntries}

\\end{document}`;

    setLatexCode(latex);
  };

  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      
      // Add content to PDF
      // Personal Info
      doc.setFontSize(18);
      doc.text(`${data.personalInfo?.firstName || ''} ${data.personalInfo?.lastName || ''}`.trim(), 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      let contactLine = [];
      if (data.personalInfo?.email) contactLine.push(data.personalInfo.email);
      if (data.personalInfo?.phone) contactLine.push(data.personalInfo.phone);
      if (data.personalInfo?.address?.city && data.personalInfo?.address?.state) {
        contactLine.push(`${data.personalInfo.address.city}, ${data.personalInfo.address.state}`);
      }
      doc.text(contactLine.join(' | '), 105, 30, { align: 'center' });
      
      // Socials
      let socialsLine = [];
      if (data.socials?.linkedIn) socialsLine.push(`LinkedIn: ${data.socials.linkedIn}`);
      if (data.socials?.github) socialsLine.push(`GitHub: ${data.socials.github}`);
      if (data.socials?.website) socialsLine.push(`Website: ${data.socials.website}`);
      
      if (socialsLine.length > 0) {
        doc.text(socialsLine.join(' | '), 105, 35, { align: 'center' });
      }
      
      let yPosition = 45;
      
      // Education
      if (data.academic && data.academic.length > 0) {
        doc.setDrawColor(70, 108, 247);
        doc.setLineWidth(0.5);
        doc.line(20, yPosition - 3, 190, yPosition - 3);
        
        doc.setFontSize(14);
        doc.setTextColor(43, 58, 103);
        doc.text("Education", 20, yPosition);
        yPosition += 8;
        
        data.academic.forEach(edu => {
          doc.setFontSize(12);
          doc.setTextColor(43, 58, 103);
          doc.text(`${edu.degree} in ${edu.fieldOfStudy}`, 20, yPosition);
          yPosition += 5;
          
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text(`${edu.institution} | ${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`, 20, yPosition);
          yPosition += 5;
          
          if (edu.grade) {
            doc.text(`Grade: ${edu.grade}`, 20, yPosition);
            yPosition += 5;
          }
          
          if (edu.description) {
            doc.setTextColor(51, 65, 85);
            const descLines = doc.splitTextToSize(edu.description, 170);
            doc.text(descLines, 20, yPosition);
            yPosition += (descLines.length * 5);
          }
          
          yPosition += 5;
        });
      }
      
      // Work Experience
      if (data.workEx && data.workEx.length > 0) {
        doc.setDrawColor(70, 108, 247);
        doc.setLineWidth(0.5);
        doc.line(20, yPosition - 3, 190, yPosition - 3);
        
        doc.setFontSize(14);
        doc.setTextColor(43, 58, 103);
        doc.text("Work Experience", 20, yPosition);
        yPosition += 8;
        
        data.workEx.forEach(exp => {
          doc.setFontSize(12);
          doc.setTextColor(43, 58, 103);
          doc.text(`${exp.position} | ${exp.company}`, 20, yPosition);
          yPosition += 5;
          
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text(`${formatDate(exp.startDate)} - ${exp.isCurrent ? 'Present' : formatDate(exp.endDate)}`, 20, yPosition);
          yPosition += 5;
          
          if (exp.description) {
            doc.setTextColor(51, 65, 85);
            const descLines = doc.splitTextToSize(exp.description, 170);
            doc.text(descLines, 20, yPosition);
            yPosition += (descLines.length * 5);
          }
          
          yPosition += 5;
        });
      }
      
      // Projects
      if (data.projects && data.projects.length > 0) {
        doc.setDrawColor(70, 108, 247);
        doc.setLineWidth(0.5);
        doc.line(20, yPosition - 3, 190, yPosition - 3);
        
        doc.setFontSize(14);
        doc.setTextColor(43, 58, 103);
        doc.text("Projects", 20, yPosition);
        yPosition += 8;
        
        data.projects.forEach(project => {
          doc.setFontSize(12);
          doc.setTextColor(43, 58, 103);
          doc.text(project.title, 20, yPosition);
          yPosition += 5;
          
          if (project.startDate || project.endDate) {
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`${formatDate(project.startDate)} - ${formatDate(project.endDate)}`, 20, yPosition);
            yPosition += 5;
          }
          
          if (project.description) {
            doc.setTextColor(51, 65, 85);
            const descLines = doc.splitTextToSize(project.description, 170);
            doc.text(descLines, 20, yPosition);
            yPosition += (descLines.length * 5);
          }
          
          if (project.technologiesUsed && project.technologiesUsed.length > 0) {
            doc.setTextColor(100, 116, 139);
            const techText = `Technologies: ${project.technologiesUsed.join(", ")}`;
            const techLines = doc.splitTextToSize(techText, 170);
            doc.text(techLines, 20, yPosition);
            yPosition += (techLines.length * 5);
          }
          
          if (project.projectLink) {
            doc.setTextColor(70, 108, 247);
            doc.text(`Project Link: ${project.projectLink}`, 20, yPosition);
            yPosition += 5;
          }
          
          yPosition += 5;
        });
      }
      
      // Skills
      if (data.skills && data.skills.length > 0) {
        doc.setDrawColor(70, 108, 247);
        doc.setLineWidth(0.5);
        doc.line(20, yPosition - 3, 190, yPosition - 3);
        
        doc.setFontSize(14);
        doc.setTextColor(43, 58, 103);
        doc.text("Skills", 20, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        
        const skillsList = data.skills.join(" • ");
        const skillsLines = doc.splitTextToSize(skillsList, 170);
        doc.text(skillsLines, 20, yPosition);
        yPosition += (skillsLines.length * 5) + 5;
      }
      
      // Certifications
      if (data.certifications && data.certifications.length > 0) {
        doc.setDrawColor(70, 108, 247);
        doc.setLineWidth(0.5);
        doc.line(20, yPosition - 3, 190, yPosition - 3);
        
        doc.setFontSize(14);
        doc.setTextColor(43, 58, 103);
        doc.text("Certifications", 20, yPosition);
        yPosition += 8;
        
        data.certifications.forEach(cert => {
          doc.setFontSize(12);
          doc.setTextColor(43, 58, 103);
          doc.text(cert.name, 20, yPosition);
          yPosition += 5;
          
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text(`${cert.issuingOrganization} | ${formatDate(cert.issueDate)}`, 20, yPosition);
          yPosition += 5;
          
          if (cert.credentialURL) {
            doc.setTextColor(70, 108, 247);
            doc.text(`Credential: ${cert.credentialURL}`, 20, yPosition);
            yPosition += 5;
          }
          
          yPosition += 3;
        });
      }
      
      // Achievements
      if (data.achievements && data.achievements.length > 0) {
        doc.setDrawColor(70, 108, 247);
        doc.setLineWidth(0.5);
        doc.line(20, yPosition - 3, 190, yPosition - 3);
        
        doc.setFontSize(14);
        doc.setTextColor(43, 58, 103);
        doc.text("Achievements", 20, yPosition);
        yPosition += 8;
        
        data.achievements.forEach(achievement => {
          doc.setFontSize(12);
          doc.setTextColor(43, 58, 103);
          doc.text(achievement.title, 20, yPosition);
          yPosition += 5;
          
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text(`${achievement.issuer} | ${formatDate(achievement.date)}`, 20, yPosition);
          yPosition += 5;
          
          if (achievement.description) {
            doc.setTextColor(51, 65, 85);
            const descLines = doc.splitTextToSize(achievement.description, 170);
            doc.text(descLines, 20, yPosition);
            yPosition += (descLines.length * 5);
          }
          
          yPosition += 3;
        });
      }
      
      // Generate blob and create URL
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const downloadPdf = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    const fileName = `${data.personalInfo?.firstName || 'Resume'}_${data.personalInfo?.lastName || ''}.pdf`.replace(/\s+/g, '_');
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyLatexToClipboard = () => {
    if (!latexCode) return;
    
    navigator.clipboard.writeText(latexCode)
      .then(() => {
        alert('LaTeX code copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy LaTeX code:', err);
        alert('Failed to copy LaTeX code. Please try again.');
      });
  };

  if (!data) {
    return (
      <div className="flex flex-col h-full bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-800">
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-bold mb-2 text-white">Resume Preview</h2>
            <p className="text-gray-400">
              Loading resume data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-800">
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Resume Preview
        </h3>
        
        <div className="flex space-x-2">
          <button 
            onClick={copyLatexToClipboard} 
            className="inline-flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={!latexCode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
              <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
            </svg>
            Copy LaTeX
          </button>
          
          <button 
            onClick={downloadPdf} 
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={!pdfUrl}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-gray-800 p-4 overflow-hidden">
        {pdfUrl ? (
          <div className="h-full w-full flex items-center justify-center">
            <iframe
              ref={pdfIframeRef}
              src={pdfUrl}
              className="w-full h-full rounded border border-gray-700 bg-white"
              title="Resume PDF"
              style={{ maxWidth: "900px", height: "calc(100vh - 130px)" }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-900 rounded border border-gray-700 p-6">
            {isGeneratingPdf ? (
              <div className="text-center text-gray-300">
                <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg font-medium">Generating PDF...</p>
                <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">Your resume will appear here</p>
                <p className="text-sm mt-2">Preparing your document...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
