
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, FileVideo, Image, AlertCircle, CheckCircle2, Clock, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

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

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<DetailedReport | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  const handleViewReport = (report: Report) => {
    // Add detailed report information
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

  const handleDeleteReport = (id: string) => {
    setReports(reports.filter(report => report.id !== id));
    toast.success("Report deleted successfully");
    setConfirmDelete(null);
  };

  const handleDownloadReport = (report: Report) => {
    // Create detailed report for download
    const detailedReport = {
      ...report,
      category: report.status === "flagged" ? ["Violent Language", "Threatening Gestures", "Visual Violence"][Math.floor(Math.random() * 3)] : undefined,
      confidence: parseFloat((0.7 + Math.random() * 0.25).toFixed(2)),
      summary: report.status === "flagged" 
        ? "This content contains elements that violate our community guidelines. The AI analysis identified potential violent or threatening content that may be harmful to viewers."
        : "This content was analyzed and found to comply with our community guidelines. No harmful elements were detected in the material."
    };

    // Convert to JSON and create download
    const reportString = JSON.stringify(detailedReport, null, 2);
    const blob = new Blob([reportString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report.id}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully');
  };
  
  const filteredReports = reports.filter(report => 
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

  // Method to add a new report (will be called from Upload page)
  const addReport = (report: Report) => {
    setReports(prevReports => [report, ...prevReports]);
  };

  // Expose the addReport method to window so it can be called from other components
  // This is a workaround until we implement proper state management
  useEffect(() => {
    (window as any).addReportToList = addReport;
    return () => {
      delete (window as any).addReportToList;
    };
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Moderation Reports</h1>
        
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
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-4 dark:text-gray-300">Content</th>
                  <th className="text-left p-4 dark:text-gray-300">Type</th>
                  <th className="text-left p-4 dark:text-gray-300">User</th>
                  <th className="text-left p-4 dark:text-gray-300">Upload Time</th>
                  <th className="text-left p-4 dark:text-gray-300">Status</th>
                  <th className="text-right p-4 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <img
                              src={report.thumbnail}
                              alt="Content thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium dark:text-gray-300">{report.id}</span>
                        </div>
                      </td>
                      <td className="p-4 dark:text-gray-300">
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
                      <td className="p-4 text-sm dark:text-gray-300">{report.user}</td>
                      <td className="p-4 text-sm dark:text-gray-300">
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
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReport(report)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadReport(report)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                            onClick={() => setConfirmDelete(report.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No reports found. Upload content to generate reports.
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
                <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img
                    src={selectedReport.thumbnail}
                    alt="Content preview"
                    className="w-full h-auto object-cover"
                  />
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Content Type:</span>
                    <span className="font-medium dark:text-gray-300 capitalize">{selectedReport.contentType}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Uploaded By:</span>
                    <span className="font-medium dark:text-gray-300">{selectedReport.user}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Upload Time:</span>
                    <span className="font-medium dark:text-gray-300">{formatDate(selectedReport.uploadTime)}</span>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <div className={`mb-4 p-3 rounded-lg ${
                  selectedReport.status === "safe" 
                    ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                    : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                }`}>
                  <div className="flex items-center gap-2">
                    {selectedReport.status === "safe" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    <span className="font-medium">
                      {selectedReport.status === "safe" 
                        ? "Content is safe" 
                        : `Content flagged: ${selectedReport.category}`}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 dark:text-gray-300">AI Analysis Summary:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedReport.summary}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 dark:text-gray-300">Confidence Score:</h4>
                  <div className="bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        selectedReport.status === "safe" 
                          ? "bg-green-500" 
                          : "bg-red-500"
                      }`}
                      style={{ width: `${selectedReport.confidence * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-right mt-1 dark:text-gray-400">{selectedReport.confidence * 100}%</p>
                </div>
                
                {selectedReport.status === "flagged" && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2 dark:text-gray-300">Violation Details:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
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
                  <Button
                    onClick={() => handleDownloadReport(selectedReport)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => confirmDelete && handleDeleteReport(confirmDelete)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
