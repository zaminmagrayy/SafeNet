
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, FileVideo, Image, AlertCircle, CheckCircle2, Clock } from "lucide-react";

type Report = {
  id: string;
  thumbnail: string;
  contentType: "video" | "image" | "text";
  uploadTime: string;
  status: "safe" | "flagged";
  user: string;
};

type DetailedReport = Report & {
  category?: string;
  confidence: number;
  summary: string;
};

const mockReports: Report[] = [
  {
    id: "rep-001",
    thumbnail: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=500&h=350&fit=crop",
    contentType: "video",
    uploadTime: "2023-05-18T14:22:30Z",
    status: "flagged",
    user: "john.doe@example.com",
  },
  {
    id: "rep-002",
    thumbnail: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=500&h=350&fit=crop",
    contentType: "image",
    uploadTime: "2023-05-18T10:15:00Z",
    status: "safe",
    user: "jane.smith@example.com",
  },
  {
    id: "rep-003",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&h=350&fit=crop",
    contentType: "video",
    uploadTime: "2023-05-17T18:05:45Z",
    status: "flagged",
    user: "robert.johnson@example.com",
  },
  {
    id: "rep-004",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&h=350&fit=crop",
    contentType: "image",
    uploadTime: "2023-05-17T09:30:12Z",
    status: "safe",
    user: "emily.davis@example.com",
  },
  {
    id: "rep-005",
    thumbnail: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=500&h=350&fit=crop",
    contentType: "text",
    uploadTime: "2023-05-16T16:42:20Z",
    status: "flagged",
    user: "michael.wilson@example.com",
  },
];

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<DetailedReport | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const handleViewReport = (report: Report) => {
    // Mock additional details when viewing a report
    const detailedReport: DetailedReport = {
      ...report,
      category: report.status === "flagged" ? ["Violent Language", "Threatening Gestures", "Visual Violence"][Math.floor(Math.random() * 3)] : undefined,
      confidence: parseFloat((0.7 + Math.random() * 0.25).toFixed(2)),
      summary: report.status === "flagged" 
        ? "This content contains elements that violate our community guidelines. The AI analysis identified potential violent or threatening content that may be harmful to viewers."
        : "This content was analyzed and found to comply with our community guidelines. No harmful elements were detected in the material."
    };
    
    setSelectedReport(detailedReport);
    setShowDetail(true);
  };
  
  const filteredReports = mockReports.filter(report => 
    report.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Moderation Reports</h1>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search reports..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Content</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Upload Time</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100">
                            <img
                              src={report.thumbnail}
                              alt="Content thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium">{report.id}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {report.contentType === "video" ? (
                            <FileVideo className="h-4 w-4 text-blue-500" />
                          ) : report.contentType === "image" ? (
                            <Image className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="h-4 w-4 text-amber-500">T</div>
                          )}
                          <span className="capitalize">{report.contentType}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{report.user}</td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {formatDate(report.uploadTime)}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={report.status === "safe" ? "outline" : "destructive"}>
                          {report.status === "safe" ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Safe
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Flagged
                            </span>
                          )}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                        >
                          View Report
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      No reports found matching your search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Report Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Moderation Report Details</DialogTitle>
            <DialogDescription>
              Complete analysis of content ID: {selectedReport?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={selectedReport.thumbnail}
                    alt="Content preview"
                    className="w-full h-auto object-cover"
                  />
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Content Type:</span>
                    <span className="font-medium capitalize">{selectedReport.contentType}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Uploaded By:</span>
                    <span className="font-medium">{selectedReport.user}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Upload Time:</span>
                    <span className="font-medium">{formatDate(selectedReport.uploadTime)}</span>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <div className={`mb-4 p-3 rounded-lg ${
                  selectedReport.status === "safe" 
                    ? "bg-green-50 text-green-800" 
                    : "bg-red-50 text-red-800"
                }`}>
                  <div className="flex items-center gap-2">
                    {selectedReport.status === "safe" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {selectedReport.status === "safe" 
                        ? "Content is safe" 
                        : `Content flagged: ${selectedReport.category}`}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">AI Analysis Summary:</h4>
                  <p className="text-sm text-gray-600">{selectedReport.summary}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Confidence Score:</h4>
                  <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        selectedReport.status === "safe" 
                          ? "bg-green-500" 
                          : "bg-red-500"
                      }`}
                      style={{ width: `${selectedReport.confidence * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-right mt-1">{selectedReport.confidence * 100}%</p>
                </div>
                
                {selectedReport.status === "flagged" && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Violation Details:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                      <li>Type: {selectedReport.category}</li>
                      <li>Severity: {selectedReport.confidence > 0.85 ? "High" : "Medium"}</li>
                      <li>Timestamp: {formatDate(selectedReport.uploadTime)}</li>
                    </ul>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDetail(false)}
                  >
                    Close
                  </Button>
                  {selectedReport.status === "flagged" && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setShowDetail(false);
                        // Here would be logic to take action on the content
                      }}
                    >
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
