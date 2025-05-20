
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DownloadCloud, FileJson, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ReportDownloadProps {
  reportData: any;
  filename?: string;
}

const ReportDownload = ({ reportData, filename = "report" }: ReportDownloadProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadJSON = () => {
    try {
      setIsDownloading(true);
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', `${filename}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download report");
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadHTML = () => {
    try {
      setIsDownloading(true);
      
      // Format the report data into a more readable structure
      const report = reportData;
      const status = report.status || "unknown";
      const statusClass = status === 'flagged' ? 'flag-unsafe' : 'flag-safe';
      
      // Create a simple HTML template with formatted data
      const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Content Report: ${report.id || filename}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; margin: 0; padding: 20px; line-height: 1.6; color: #333; }
            h1 { color: #6200ea; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; }
            .report-container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .report-section { margin-bottom: 20px; }
            .report-section h2 { color: #7e57c2; margin-top: 30px; }
            .report-data { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
            .report-table { width: 100%; border-collapse: collapse; }
            .report-table th { text-align: left; padding: 8px; background-color: #f0f0f0; }
            .report-table td { padding: 8px; border-bottom: 1px solid #ddd; }
            .timestamp { color: #757575; font-size: 14px; margin-top: 30px; text-align: right; }
            .flag { padding: 4px 8px; border-radius: 4px; font-size: 14px; font-weight: 600; display: inline-block; margin-right: 8px; }
            .flag-safe { background-color: #e6f7e6; color: #2e7d32; }
            .flag-warning { background-color: #fff8e1; color: #f57f17; }
            .flag-unsafe { background-color: #ffebee; color: #c62828; }
            .thumbnail { max-width: 300px; margin-top: 20px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="report-container">
            <h1>Content Moderation Report</h1>
            
            <div class="report-section">
              <h2>Report Summary</h2>
              <div class="report-data">
                <table class="report-table">
                  <tr>
                    <th>Report ID</th>
                    <td>${report.id || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Content Type</th>
                    <td>${report.contentType || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Upload Time</th>
                    <td>${new Date(report.uploadTime).toLocaleString() || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td><span class="flag ${statusClass}">${report.status || 'N/A'}</span></td>
                  </tr>
                  <tr>
                    <th>User</th>
                    <td>${report.user || 'N/A'}</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <div class="report-section">
              <h2>AI Analysis Results</h2>
              <div class="report-data">
                <table class="report-table">
                  <tr>
                    <th>Reason</th>
                    <td>${report.aiAnalysis?.reason || 'No reason provided'}</td>
                  </tr>
                  <tr>
                    <th>Category</th>
                    <td>${report.aiAnalysis?.category || 'Unknown'}</td>
                  </tr>
                  <tr>
                    <th>Confidence</th>
                    <td>${((report.aiAnalysis?.confidence || 0) * 100).toFixed(1)}%</td>
                  </tr>
                </table>
              </div>
            </div>
            
            ${report.thumbnail ? `
            <div class="report-section">
              <h2>Content Thumbnail</h2>
              <img src="${report.thumbnail}" alt="Content thumbnail" class="thumbnail" />
            </div>` : ''}
            
            <div class="timestamp">Report generated on ${new Date().toLocaleString()}</div>
          </div>
        </body>
      </html>
      `;
      
      const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
      
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', `${filename}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("HTML report downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download HTML report");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          disabled={isDownloading || !reportData}
        >
          {isDownloading ? (
            <><span>Downloading</span><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div></>
          ) : (
            <><DownloadCloud className="h-4 w-4" /> Download Report</>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={downloadJSON} disabled={isDownloading || !reportData}>
          <FileJson className="h-4 w-4 mr-2" />
          <span>Download as JSON</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadHTML} disabled={isDownloading || !reportData}>
          <FileText className="h-4 w-4 mr-2" />
          <span>Download as HTML</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReportDownload;
