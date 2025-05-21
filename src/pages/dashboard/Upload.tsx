
import React, { useState, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Upload as UploadIcon, AlertCircle, CheckCircle2, Loader2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ContentType = 'video' | 'image' | 'text';
type AnalysisResult = 'safe' | 'flagged';

const UploadPage = () => {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [contentType, setContentType] = useState<ContentType>('video');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysisDetails, setAnalysisDetails] = useState<any>(null);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast: showToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Set content type based on file type
      if (selectedFile.type.startsWith('image/')) {
        setContentType('image');
      } else if (selectedFile.type.startsWith('video/')) {
        setContentType('video');
      } else if (selectedFile.type === 'text/plain' || selectedFile.type === 'application/json') {
        setContentType('text');
      }
      
      // Reset previous analysis when file changes
      setResult(null);
      setAnalysisDetails(null);
    }
  };

  // Function to analyze content using Gemini API via Supabase Edge Function
  const analyzeContent = async (contentToAnalyze: string, type: ContentType) => {
    try {
      // Check if we've already analyzed this exact content
      if (contentToAnalyze === lastAnalyzedContent) {
        console.log("Content already analyzed, using existing result");
        return analysisDetails;
      }
      
      const { data, error } = await supabase.functions.invoke('analyze-content', {
        body: { 
          content: contentToAnalyze,
          contentType: type
        }
      });

      if (error) {
        console.error('Error calling analyze-content function:', error);
        throw new Error('Failed to analyze content');
      }

      console.log('Analysis response:', data);
      
      // Store this content as last analyzed to prevent duplicate processing
      setLastAnalyzedContent(contentToAnalyze);
      
      return data;
    } catch (err) {
      console.error('Error in analyzeContent:', err);
      // Return a default analysis for error cases
      return {
        safe: false,
        reason: "Unable to analyze content - service unavailable",
        category: "error",
        confidence: 0.5,
        detailedAnalysis: "The content analysis service is currently unavailable. Please try again later."
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url && !file) {
      toast.error('Please provide a URL or upload a file');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to upload content');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Content uploaded successfully');
      setIsUploading(false);
      setIsAnalyzing(true);
      
      // Extract content for analysis
      let contentToAnalyze = caption;
      if (!contentToAnalyze) {
        contentToAnalyze = url || file?.name || 'Sample content for analysis';
        
        // If it's a text file, try to read its content
        if (file && contentType === 'text') {
          try {
            const text = await file.text();
            contentToAnalyze = text.substring(0, 5000); // Limit to 5000 chars
          } catch (error) {
            console.error('Error reading text file:', error);
          }
        }
      }
      
      // Analyze content using Gemini API
      const analysisResult = await analyzeContent(contentToAnalyze, contentType);
      
      // Store analysis details
      setAnalysisDetails(analysisResult);
      
      // Determine result based on analysis
      const isSafe = analysisResult.safe === true;
      const finalResult: AnalysisResult = isSafe ? 'safe' : 'flagged';
      setResult(finalResult);
      setIsAnalyzing(false);
      
      // Generate a unique ID for the report
      const reportId = 'rep-' + Date.now().toString().substring(6);
      
      // Create a thumbnail URL based on content type
      let thumbnailUrl = '';
      if (file) {
        if (contentType === 'image') {
          thumbnailUrl = URL.createObjectURL(file);
        } else {
          // Use placeholder images for video and text
          thumbnailUrl = contentType === 'video' 
            ? 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=500&h=350&fit=crop'
            : 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&h=350&fit=crop';
        }
      } else {
        // Use placeholder images based on content type
        thumbnailUrl = contentType === 'video' 
          ? 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=500&h=350&fit=crop'
          : contentType === 'image'
            ? 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=500&h=350&fit=crop'
            : 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&h=350&fit=crop';
      }
      
      // Save report to Supabase database
      const { data: reportData, error: reportError } = await supabase
        .from('content_reports')
        .insert({
          user_id: user.id,
          content_type: contentType,
          thumbnail: thumbnailUrl,
          status: finalResult,
          upload_time: new Date().toISOString(),
          ai_analysis: analysisResult
        })
        .select('id')
        .single();

      if (reportError) {
        console.error('Error saving report to database:', reportError);
        toast.error('Failed to save content report');
      } else {
        console.log('Report saved to database:', reportData);
        
        // Create report object that matches the Report type for the UI
        const report = {
          id: reportData?.id || reportId,
          thumbnail: thumbnailUrl,
          contentType,
          uploadTime: new Date().toISOString(),
          status: finalResult,
          user: user.email || 'current.user@example.com',
          aiAnalysis: {
            reason: analysisResult.reason || 'No specific reason provided',
            category: analysisResult.category || 'unknown',
            confidence: analysisResult.confidence || 0.5,
            detailedAnalysis: analysisResult.detailedAnalysis || ''
          }
        };
        
        // Add the report to the reports list using the exposed method from Reports component
        if (typeof (window as any).addReportToList === 'function') {
          (window as any).addReportToList(report);
        }
        
        // If content is flagged, also add to flagged accounts list
        if (finalResult === 'flagged') {
          const { data: flaggedData, error: flaggedError } = await supabase
            .from('flagged_accounts')
            .upsert({
              user_id: user.id,
              username: user.email?.split('@')[0] || 'user',
              email: user.email || 'unknown',
              last_violation: new Date().toISOString(),
              status: 'active',
              violation_type: analysisResult.category || 'policy_violation'
            }, {
              onConflict: 'user_id', 
              ignoreDuplicates: false
            })
            .select();

          if (flaggedError) {
            console.error('Error adding flagged account to database:', flaggedError);
          } else {
            console.log('Flagged account added to database:', flaggedData);
            
            const flaggedAccount = {
              id: flaggedData?.[0]?.id || 'usr-' + Date.now().toString().substring(6),
              username: user.email?.split('@')[0] || 'current_user',
              email: user.email || 'current.user@example.com',
              violations: 1,
              lastViolation: new Date().toISOString(),
              status: 'active' as const,
              violationType: analysisResult.category || 'policy_violation'
            };
            
            if (typeof (window as any).addFlaggedAccount === 'function') {
              (window as any).addFlaggedAccount(flaggedAccount);
            }
          }
        }
        
        // Show a centered notification toast
        showToast({
          title: finalResult === 'flagged' ? "Content Flagged" : "Content Analysis Complete",
          description: finalResult === 'flagged' 
            ? "Your content was flagged for potential policy violations. View the full report in the Moderation Reports tab." 
            : "Your content has been analyzed and marked as safe. A report is available in the Moderation Reports tab.",
          variant: finalResult === 'flagged' ? "destructive" : "default",
        });
      }
      
    } catch (error) {
      console.error('Error during upload or analysis:', error);
      toast.error('There was an error processing your request');
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setCaption('');
    setHashtags('');
    setContentType('video');
    setFile(null);
    setResult(null);
    setAnalysisDetails(null);
    setLastAnalyzedContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Upload Content</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Submit Content for AI Analysis</CardTitle>
          <CardDescription>
            Upload media content or provide a URL to analyze for policy violations
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">Content URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/video.mp4"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  // Reset previous analysis when URL changes
                  if (result) {
                    setResult(null);
                    setAnalysisDetails(null);
                  }
                }}
                disabled={!!file || isUploading || isAnalyzing}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter URL from YouTube, Instagram, or Facebook</p>
            </div>
            
            <div className="space-y-2">
              <Label>Or Upload File</Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,video/*,.txt,.json"
                  disabled={!!url || isUploading || isAnalyzing}
                />
                
                {file ? (
                  <div>
                    <p className="font-medium dark:text-gray-300">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setResult(null);
                        setAnalysisDetails(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="mt-2"
                      disabled={isUploading || isAnalyzing}
                    >
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon className="h-10 w-10 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm font-medium dark:text-gray-300">Click to upload media</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Supports: MP4, JPG, PNG, GIF, TXT, JSON
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (Optional)</Label>
              <Textarea
                id="caption"
                placeholder="Add a caption for your content"
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  if (result) {
                    setResult(null);
                    setAnalysisDetails(null);
                  }
                }}
                disabled={isUploading || isAnalyzing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hashtags">Hashtags (Optional)</Label>
              <Input
                id="hashtags"
                placeholder="#safe #appropriate #content"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                disabled={isUploading || isAnalyzing}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Content Type</Label>
              <RadioGroup
                value={contentType}
                onValueChange={(value) => {
                  setContentType(value as ContentType);
                  if (result) {
                    setResult(null);
                    setAnalysisDetails(null);
                  }
                }}
                className="flex gap-4"
                disabled={isUploading || isAnalyzing}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="video" />
                  <Label htmlFor="video">Video</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image" id="image" />
                  <Label htmlFor="image">Image</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="text" />
                  <Label htmlFor="text">Text</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isUploading || isAnalyzing}
              type="button"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={(!url && !file) || isUploading || isAnalyzing || !!result}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : result ? (
                'Already Analyzed'
              ) : (
                'Analyze Content'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {result && (
        <Card className={result === 'safe' ? 'border-green-500' : 'border-red-500'}>
          <CardHeader className={result === 'safe' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}>
            <CardTitle className="flex items-center gap-2">
              {result === 'safe' ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <span className={result === 'safe' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                    Content Approved
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  <span className="text-red-700 dark:text-red-300">
                    Content Flagged
                  </span>
                </>
              )}
            </CardTitle>
            <CardDescription className={result === 'safe' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {result === 'safe' 
                ? 'This content meets our community guidelines.' 
                : 'This content may violate our community guidelines.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Create tabs for Analysis Summary and Detailed Analysis */}
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="summary">Analysis Summary</TabsTrigger>
                <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="mt-4">
                {result === 'safe' ? (
                  <div className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300">
                      Our AI analysis indicates that your content is safe for our platform.
                      The content has been processed and can now be published.
                    </p>
                    {analysisDetails && (
                      <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <AlertTitle className="text-green-800 dark:text-green-300">AI Analysis Results</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-400">
                          {analysisDetails.reason || "No specific issues were found in your content."}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-semibold">Confidence: {(analysisDetails.confidence * 100).toFixed(1)}%</span>
                            <span className="text-sm">Category: {analysisDetails.category || "safe"}</span>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300">
                      Our AI analysis has detected potential policy violations in your content.
                    </p>
                    {analysisDetails && (
                      <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <AlertTitle className="text-red-800 dark:text-red-300">Analysis Details</AlertTitle>
                        <AlertDescription className="space-y-2 text-red-700 dark:text-red-400">
                          <div><span className="font-medium">Reason:</span> {analysisDetails.reason}</div>
                          <div><span className="font-medium">Category:</span> {analysisDetails.category}</div>
                          <div><span className="font-medium">Confidence:</span> {(analysisDetails.confidence * 100).toFixed(1)}%</div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="detailed" className="mt-4">
                {analysisDetails && analysisDetails.detailedAnalysis ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {analysisDetails.detailedAnalysis.split('\n\n').map((paragraph: string, index: number) => (
                      <div key={index} className="mb-4">
                        {paragraph.startsWith('**') ? (
                          <div>
                            <h4 className="font-bold mb-1">{paragraph.split('**:')[0].replace(/\*\*/g, '')}</h4>
                            <p>{paragraph.split('**:')[1]?.trim()}</p>
                          </div>
                        ) : (
                          <p>{paragraph}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 italic">
                    No detailed analysis available for this content.
                  </div>
                )}
                {analysisDetails && analysisDetails.aiResponse && !analysisDetails.detailedAnalysis && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                    <h4 className="text-sm font-semibold mb-2">AI Response</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                      {analysisDetails.aiResponse}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end">
              <Button 
                className="flex items-center gap-2"
                variant="outline"
                onClick={() => navigate('/dashboard/reports')}
              >
                <BarChart3 className="h-4 w-4" />
                View Full Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UploadPage;
