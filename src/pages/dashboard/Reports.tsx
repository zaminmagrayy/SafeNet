import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import ReportDownload from "@/components/ReportDownload";

const Reports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
  }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // This is a placeholder for the real implementation
      // In a real app, we would fetch reports from Supabase
      
      // Simulate API call delay
      setTimeout(() => {
        const mockReports = [
          {
            id: "1",
            date: new Date().toISOString(),
            filename: "profile-image-1.jpg",
            status: "safe",
            contentType: "image/jpeg",
            result: {
              safetyRating: {
                harmful: false,
                score: 0.02,
                reasons: ["The image appears to be a standard professional profile photo."]
              },
              confidenceScore: 0.98,
              metadata: {
                dimensions: "1024x1024",
                fileSize: "256KB"
              }
            }
          },
          {
            id: "2",
            date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            filename: "document-scan.pdf",
            status: "warning",
            contentType: "application/pdf",
            result: {
              safetyRating: {
                harmful: false,
                score: 0.35,
                reasons: ["The document contains personally identifiable information that should be handled with care."]
              },
              confidenceScore: 0.85,
              metadata: {
                pages: 3,
                fileSize: "1.2MB"
              }
            }
          },
          {
            id: "3",
            date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            filename: "promotional-content.png",
            status: "unsafe",
            contentType: "image/png",
            result: {
              safetyRating: {
                harmful: true,
                score: 0.78,
                reasons: ["The image contains misleading information that could be considered deceptive."]
              },
              confidenceScore: 0.91,
              metadata: {
                dimensions: "1200x628",
                fileSize: "450KB"
              }
            }
          }
        ];
        
        setReports(mockReports);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error fetching reports:", error);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "safe":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "unsafe":
        return <Info className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "safe":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Safe</Badge>;
      case "warning":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">Warning</Badge>;
      case "unsafe":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">Unsafe</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-200">Content Analysis Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            View and download safety reports for your uploaded content
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Filter Reports
          </Button>
          {selectedReport && (
            <ReportDownload 
              reportData={selectedReport.result} 
              filename={`report-${selectedReport.id}`}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Select a report to view details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : reports.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p>No reports found</p>
                  <p className="text-sm mt-1">Upload content to generate reports</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.map((report) => (
                    <li key={report.id}>
                      <button
                        onClick={() => setSelectedReport(report)}
                        className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                          selectedReport?.id === report.id
                            ? "bg-gray-100 dark:bg-gray-800"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div className="mt-1">
                          {getStatusIcon(report.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate dark:text-gray-200">
                            {report.filename}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {format(new Date(report.date), "MMM d, yyyy")}
                          </p>
                          <div className="mt-2">
                            {getStatusBadge(report.status)}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
            <CardFooter className="border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" className="w-full" disabled={loading}>
                View All Reports
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            {selectedReport ? (
              <>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{selectedReport.filename}</CardTitle>
                      <CardDescription>
                        Uploaded on {format(new Date(selectedReport.date), "MMMM d, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                    <div>
                      {getStatusBadge(selectedReport.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2 dark:text-gray-200">Safety Assessment</h3>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex justify-between mb-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Safety Score</span>
                          <span className="text-sm font-medium dark:text-gray-300">
                            {Math.round((1 - selectedReport.result.safetyRating.score) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              selectedReport.status === "safe" 
                                ? "bg-green-500" 
                                : selectedReport.status === "warning" 
                                ? "bg-yellow-500" 
                                : "bg-red-500"
                            }`} 
                            style={{ width: `${Math.round((1 - selectedReport.result.safetyRating.score) * 100)}%` }}
                          ></div>
                        </div>

                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2 dark:text-gray-300">Analysis Notes</h4>
                          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {selectedReport.result.safetyRating.reasons.map((reason: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="mt-0.5">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2 dark:text-gray-200">File Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h4 className="text-sm font-medium mb-1 dark:text-gray-300">File Type</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedReport.contentType}</p>
                        </div>
                        
                        {selectedReport.result.metadata.dimensions && (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h4 className="text-sm font-medium mb-1 dark:text-gray-300">Dimensions</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedReport.result.metadata.dimensions}</p>
                          </div>
                        )}
                        
                        {selectedReport.result.metadata.pages && (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h4 className="text-sm font-medium mb-1 dark:text-gray-300">Pages</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedReport.result.metadata.pages}</p>
                          </div>
                        )}
                        
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h4 className="text-sm font-medium mb-1 dark:text-gray-300">File Size</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedReport.result.metadata.fileSize}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2 dark:text-gray-200">Confidence Rating</h3>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex justify-between mb-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Confidence Score</span>
                          <span className="text-sm font-medium dark:text-gray-300">
                            {Math.round(selectedReport.result.confidenceScore * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full bg-blue-500" 
                            style={{ width: `${Math.round(selectedReport.result.confidenceScore * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
                  <ReportDownload 
                    reportData={selectedReport.result} 
                    filename={`report-${selectedReport.id}`}
                  />
                </CardFooter>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-16">
                <div className="text-center p-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-lg font-medium mb-2 dark:text-gray-200">No Report Selected</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Select a report from the list to view detailed information about the content analysis.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default Reports;
