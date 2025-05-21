
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type ReportProps = {
  reportData: {
    id: string;
    status: string;
    contentType: string;
    uploadTime: string;
    user: string;
    aiAnalysis: {
      reason: string;
      category: string;
      confidence: number;
      detailedAnalysis?: string;
    };
  };
  filename: string;
};

const ReportDownload = ({ reportData, filename }: ReportProps) => {
  const handleDownload = () => {
    // Format the report as a clean structured report
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    };

    // Generate detailed explanation based on content type and violation category
    const generateDetailedExplanation = () => {
      // If we have a detailed analysis from AI, use that
      if (reportData.aiAnalysis?.detailedAnalysis) {
        // Clean up markdown formatting if needed
        return reportData.aiAnalysis.detailedAnalysis
          .replace(/\*\*/g, '') // Remove markdown bold
          .replace(/^#{1,6}\s+/gm, ''); // Remove markdown headers
      }
      
      if (reportData.status === 'safe') {
        return 'This content complies with our community guidelines and has been marked safe.';
      }

      const { category, reason } = reportData.aiAnalysis;
      let detailedExplanation = '';
      
      switch (reportData.contentType) {
        case 'image':
          detailedExplanation = `The uploaded image ${reason.toLowerCase()}. `;
          break;
        case 'video':
          detailedExplanation = `The uploaded video ${reason.toLowerCase()}. `;
          break;
        case 'text':
          detailedExplanation = `The uploaded text ${reason.toLowerCase()}. `;
          break;
        default:
          detailedExplanation = `The uploaded content ${reason.toLowerCase()}. `;
      }

      switch (category) {
        case 'visual_policy_violation':
          detailedExplanation += 'Visual content that depicts violence, graphic imagery, or other prohibited visual elements violates our platform policies aimed at creating a safe environment for all users.';
          break;
        case 'text_policy_violation':
          detailedExplanation += 'Text that contains hate speech, threats, harassment, or other prohibited language violates our platform policies designed to prevent harmful communication.';
          break;
        case 'video_policy_violation':
          detailedExplanation += 'Video content that includes violence, dangerous acts, or other prohibited footage violates our platform policies established to maintain a positive and safe user experience.';
          break;
        case 'policy_violation':
        default:
          detailedExplanation += 'This content violates our community guidelines which prohibit harmful, offensive, or dangerous material that could negatively impact our platform users.';
      }

      return detailedExplanation;
    };

    // Extract sections from the detailed analysis if available
    const parseDetailedAnalysis = () => {
      const detailedAnalysis = reportData.aiAnalysis?.detailedAnalysis || '';
      
      // Initialize sections with default values
      const sections = {
        overallAssessment: 'No overall assessment provided',
        specificIssues: 'No specific issues identified',
        reasoning: 'No reasoning provided',
        recommendations: 'No recommendations provided'
      };
      
      // Try to extract each section from the detailed analysis
      if (detailedAnalysis) {
        // Match Overall Assessment section
        const overallMatch = detailedAnalysis.match(/\*\*Overall Assessment\*\*:\s*([^*]*?)(?=\*\*|$)/is);
        if (overallMatch && overallMatch[1].trim()) {
          sections.overallAssessment = overallMatch[1].trim();
        }
        
        // Match Specific Issues section
        const issuesMatch = detailedAnalysis.match(/\*\*Specific Issues\*\*:\s*([^*]*?)(?=\*\*|$)/is);
        if (issuesMatch && issuesMatch[1].trim()) {
          sections.specificIssues = issuesMatch[1].trim();
        }
        
        // Match Reasoning section
        const reasoningMatch = detailedAnalysis.match(/\*\*Reasoning\*\*:\s*([^*]*?)(?=\*\*|$)/is);
        if (reasoningMatch && reasoningMatch[1].trim()) {
          sections.reasoning = reasoningMatch[1].trim();
        }
        
        // Match Recommendations section
        const recommendationsMatch = detailedAnalysis.match(/\*\*Recommendations\*\*:\s*([^*]*?)(?=\*\*|$)/is);
        if (recommendationsMatch && recommendationsMatch[1].trim()) {
          sections.recommendations = recommendationsMatch[1].trim();
        }
      }
      
      return sections;
    };

    const detailedExplanation = generateDetailedExplanation();
    const confidencePercentage = ((reportData.aiAnalysis.confidence || 0) * 100).toFixed(1);
    const analysisSection = parseDetailedAnalysis();

    const reportContent = `
CONTENT MODERATION REPORT
=========================

REPORT ID: ${reportData.id}
REPORT DATE: ${formatDate(reportData.uploadTime)}
STATUS: ${reportData.status.toUpperCase()}

CONTENT INFORMATION:
-------------------
Content Type: ${reportData.contentType}
Uploaded By: ${reportData.user}
Upload Time: ${formatDate(reportData.uploadTime)}

AI ANALYSIS SUMMARY:
------------------
Category: ${reportData.aiAnalysis.category || 'Unknown'}
Confidence: ${confidencePercentage}%
Reason: ${reportData.aiAnalysis.reason || 'No reason provided'}

DETAILED ANALYSIS:
----------------
Overall Assessment: ${analysisSection.overallAssessment}

Specific Issues: ${analysisSection.specificIssues}

Reasoning: ${analysisSection.reasoning}

Recommendations: ${analysisSection.recommendations}

GENERAL EXPLANATION:
-----------------
${detailedExplanation}

RECOMMENDATIONS:
--------------
${reportData.status === 'flagged' 
  ? 'This content has been flagged as potentially violating platform policies. Immediate review is recommended. Consider removing this content and notifying the user about our content guidelines.'
  : 'This content has been marked as safe and complies with platform guidelines. No action is required.'}

Generated by Safe Net Content Moderation System
Report generated on: ${formatDate(new Date().toISOString())}
`;

    // Create a Blob from the report content
    const blob = new Blob([reportContent], { type: 'text/plain' });
    
    // Create a downloadable link and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  return (
    <Button variant="default" onClick={handleDownload}>
      <Download className="mr-2 h-4 w-4" />
      Download Report
    </Button>
  );
};

export default ReportDownload;
