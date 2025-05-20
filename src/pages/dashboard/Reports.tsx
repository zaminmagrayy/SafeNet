
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  AlarmClock, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Trash2, 
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import ReportDownload from '@/components/ReportDownload';

// Mock data for content reports
const INITIAL_REPORTS = [
  {
    id: 'rep-123456',
    thumbnail: 'https://images.unsplash.com/photo-1649972954532-a0e5f16268ba?w=500&h=350&fit=crop',
    contentType: 'video',
    uploadTime: '2024-04-15T10:30:00Z',
    status: 'flagged',
    user: 'user1@example.com',
    aiAnalysis: {
      reason: 'Contains violent imagery',
      category: 'violence',
      confidence: 0.89
    }
  },
  {
    id: 'rep-234567',
    thumbnail: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=500&h=350&fit=crop',
    contentType: 'image',
    uploadTime: '2024-04-14T14:20:00Z',
    status: 'safe',
    user: 'user2@example.com',
    aiAnalysis: {
      reason: 'No issues detected',
      category: 'safe',
      confidence: 0.95
    }
  },
  {
    id: 'rep-345678',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&h=350&fit=crop',
    contentType: 'text',
    uploadTime: '2024-04-13T09:15:00Z',
    status: 'flagged',
    user: 'user3@example.com',
    aiAnalysis: {
      reason: 'Potentially offensive language',
      category: 'hate_speech',
      confidence: 0.76
    }
  }
];

// Report type definition
type Report = {
  id: string;
  thumbnail: string;
  contentType: 'video' | 'image' | 'text';
  uploadTime: string;
  status: 'safe' | 'flagged';
  user: string;
  aiAnalysis: {
    reason: string;
    category: string;
    confidence: number;
  };
};

const ReportsPage = () => {
  const [filter, setFilter] = useState<'all' | 'flagged' | 'safe'>('all');
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  
  // Function to add a new report (exposed to Upload component)
  const addReportToList = (newReport: Report) => {
    setReports(prev => [newReport, ...prev]);
  };
  
  // Expose the function to window for Upload component
  useEffect(() => {
    (window as any).addReportToList = addReportToList;
    
    return () => {
      delete (window as any).addReportToList;
    };
  }, []);
  
  // Filter reports based on current filter
  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });
  
  const handleDeleteReport = (reportId: string) => {
    setReports(reports.filter(report => report.id !== reportId));
    toast.success("Report deleted successfully");
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">Moderation Reports</h1>
        
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as 'all' | 'flagged' | 'safe')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Filter</SelectLabel>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="flagged">Flagged Content</SelectItem>
              <SelectItem value="safe">Safe Content</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <Card key={report.id} className={report.status === 'flagged' ? 'border-red-300 dark:border-red-900' : ''}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">{report.id}</CardTitle>
                  <CardDescription>{formatDate(report.uploadTime)}</CardDescription>
                </div>
                <div>
                  <Badge variant={report.status === 'flagged' ? 'destructive' : 'secondary'}>
                    {report.status === 'flagged' ? (
                      <AlertCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    )}
                    {report.status === 'flagged' ? 'Flagged' : 'Safe'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <img 
                      src={report.thumbnail} 
                      alt={`Thumbnail for ${report.id}`}
                      className="w-full aspect-video rounded-md object-cover" 
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold mb-1">User</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{report.user}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">Content Type</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{report.contentType}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">AI Analysis</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{report.aiAnalysis.reason}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">Confidence</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{(report.aiAnalysis.confidence * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setIsDownloadOpen(true);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Logic to view full report details
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the report
                              and remove it from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteReport(report.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <AlarmClock className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">No reports found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              There are no content moderation reports matching your current filter.
            </p>
          </div>
        )}
      </div>
      
      {selectedReport && (
        <ReportDownload
          open={isDownloadOpen}
          onOpenChange={setIsDownloadOpen}
          report={selectedReport}
        />
      )}
    </div>
  );
};

export default ReportsPage;
