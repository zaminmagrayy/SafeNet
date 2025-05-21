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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  AlarmClock, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Trash2, 
  FileText,
  Loader2,
  Eye 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReportDownload from '@/components/ReportDownload';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { user } = useAuth();
  
  // Fetch reports from database
  const fetchReports = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('content_reports')
        .select('*')
        .order('upload_time', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Transform database data to Report type
        const transformedReports: Report[] = data.map((report: any) => ({
          id: report.id,
          thumbnail: report.thumbnail,
          contentType: report.content_type,
          uploadTime: report.upload_time,
          status: report.status,
          user: user.email || 'unknown',
          aiAnalysis: {
            reason: report.ai_analysis?.reason || 'No reason provided',
            category: report.ai_analysis?.category || 'unknown',
            confidence: report.ai_analysis?.confidence || 0.5
          }
        }));
        
        setReports(transformedReports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, [user]);
  
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
  
  const handleDeleteReport = async (reportId: string) => {
    try {
      setIsLoading(true);
      
      // Delete the report from Supabase
      const { error } = await supabase
        .from('content_reports')
        .delete()
        .eq('id', reportId);
      
      if (error) {
        throw error;
      }
      
      // Remove report from local state to reflect deletion
      setReports(prevReports => prevReports.filter(report => report.id !== reportId));
      toast.success("Report deleted successfully");
      
      // If the deleted report was the selected one in the details dialog, close the dialog
      if (selectedReport && selectedReport.id === reportId) {
        setIsDetailsDialogOpen(false);
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    } finally {
      setIsLoading(false);
    }
  };

  // Add flagged account to database
  const handleFlagAccount = async (report: Report) => {
    // Check if the report has already been flagged
    if (report.status === 'flagged') {
      try {
        // Use report's information to create a flagged account entry
        const newFlaggedAccount = {
          user_id: user?.id || '',
          username: report.user.split('@')[0], // Extract username from email
          email: report.user,
          violations: 1,
          last_violation: new Date().toISOString(),
          status: 'active',
          violation_type: report.aiAnalysis?.category || 'policy_violation',
        };

        console.log("Flagging account with data:", newFlaggedAccount);

        // Insert the flagged account into Supabase
        const { data, error } = await supabase
          .from('flagged_accounts')
          .insert([newFlaggedAccount]);

        if (error) {
          console.error("Supabase error details:", error);
          throw error;
        }

        toast.success('Account has been flagged and added to the flagged accounts list');
      } catch (error) {
        console.error('Error flagging account:', error);
        toast.error('Failed to flag account');
      }
    } else {
      toast.info('Only flagged content can result in account flagging');
    }
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

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setIsDetailsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-lg">Loading reports...</span>
      </div>
    );
  }

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
                    
                    <div className="flex flex-wrap space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(report)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      {report.status === 'flagged' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30"
                          onClick={() => handleFlagAccount(report)}
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Flag Account
                        </Button>
                      )}
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

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Complete information about this content report
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <img 
                  src={selectedReport.thumbnail} 
                  alt="Content thumbnail" 
                  className="max-h-[300px] rounded-md object-contain border border-gray-200 dark:border-gray-800" 
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Report Information</h3>
                  <Badge variant={selectedReport.status === 'flagged' ? 'destructive' : 'secondary'}>
                    {selectedReport.status === 'flagged' ? 'Flagged' : 'Safe'}
                  </Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Property</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Report ID</TableCell>
                      <TableCell>{selectedReport.id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Content Type</TableCell>
                      <TableCell className="capitalize">{selectedReport.contentType}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Upload Time</TableCell>
                      <TableCell>{formatDate(selectedReport.uploadTime)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">User</TableCell>
                      <TableCell>{selectedReport.user}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <h3 className="text-lg font-medium pt-4">AI Analysis</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Property</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Reason</TableCell>
                      <TableCell>{selectedReport.aiAnalysis?.reason || 'No reason provided'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Category</TableCell>
                      <TableCell>{selectedReport.aiAnalysis?.category || 'Unknown'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Confidence</TableCell>
                      <TableCell>{((selectedReport.aiAnalysis?.confidence || 0) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
            {selectedReport && (
              <>
                <ReportDownload
                  reportData={selectedReport}
                  filename={`report-${selectedReport.id}`}
                />
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleDeleteReport(selectedReport.id);
                    setIsDetailsDialogOpen(false);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Report
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsPage;
