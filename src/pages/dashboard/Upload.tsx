
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileVideo, Image, Upload as UploadIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const apiKey = "AIzaSyAh77KVUKjbH5KO3zwwjSzMwavpyWD7HXg"; // Gemini API Key

type ModerationResult = {
  status: "safe" | "flagged";
  category?: string;
  confidence: number;
  summary: string;
};

const Upload = () => {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<ModerationResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url && !file) {
      toast.error("Please provide a URL or upload a file");
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Simulating Gemini API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, randomly determine if content is safe or flagged
      const isSafe = Math.random() > 0.3;
      
      const mockResult: ModerationResult = isSafe 
        ? {
            status: "safe",
            confidence: parseFloat((0.8 + Math.random() * 0.15).toFixed(2)),
            summary: "No harmful content detected. The content appears to be safe for all audiences."
          }
        : {
            status: "flagged",
            category: ["Violent Language", "Threatening Gestures", "Visual Violence"][Math.floor(Math.random() * 3)],
            confidence: parseFloat((0.7 + Math.random() * 0.2).toFixed(2)),
            summary: "Potentially harmful content detected. The material contains elements that may be considered violent or threatening."
          };
      
      setResult(mockResult);
      setShowResult(true);
      
      if (mockResult.status === "safe") {
        toast.success("Analysis complete. Content is safe.");
      } else {
        toast.error("Analysis complete. Content has been flagged.");
      }
    } catch (error) {
      toast.error("An error occurred during analysis");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setCaption("");
    setHashtags("");
    setFile(null);
    setResult(null);
    setShowResult(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Content for Moderation</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Content Analysis</CardTitle>
          <CardDescription>
            Upload or provide a URL to content you want to analyze for safety.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">Content URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/video.mp4"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-sm text-gray-500">Or</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">Upload File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center">
                <div className="flex space-x-2 mb-4">
                  <FileVideo className="h-6 w-6 text-gray-400" />
                  <Image className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Drag and drop your file here or click to browse
                </p>
                <Input
                  id="file"
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file")?.click()}
                >
                  Select File
                </Button>
                {file && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <span>Selected:</span>
                    <span className="font-medium">{file.name}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (Optional)</Label>
              <Textarea
                id="caption"
                placeholder="Enter caption for your content..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hashtags">Hashtags (Optional)</Label>
              <Input
                id="hashtags"
                placeholder="#safecontent #example"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>Reset</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? (
              <>Analyzing...</>
            ) : (
              <>
                <UploadIcon className="mr-2 h-4 w-4" /> Analyze Content
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Results Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Content Analysis Result</DialogTitle>
            <DialogDescription>
              Our AI has analyzed your content for potential violations.
            </DialogDescription>
          </DialogHeader>
          
          {result && (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                result.status === "safe" 
                  ? "bg-green-50 text-green-800" 
                  : "bg-red-50 text-red-800"
              }`}>
                {result.status === "safe" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {result.status === "safe" 
                    ? "Content is safe" 
                    : `Content flagged: ${result.category}`}
                </span>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Summary:</h4>
                <p className="text-sm text-gray-600">{result.summary}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Confidence Score:</h4>
                <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      result.status === "safe" 
                        ? "bg-green-500" 
                        : "bg-red-500"
                    }`}
                    style={{ width: `${result.confidence * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right mt-1">{result.confidence * 100}%</p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button onClick={() => setShowResult(false)}>Close</Button>
                <Button 
                  variant="outline"
                  onClick={handleReset}
                >
                  Test Another
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Upload;
