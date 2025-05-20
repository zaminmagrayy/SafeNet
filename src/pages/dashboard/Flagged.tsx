
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, AlertCircle, UserX } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type FlaggedAccount = {
  id: string;
  username: string;
  email: string;
  violations: number;
  lastViolation: string;
  status: "active" | "suspended";
};

const mockAccounts: FlaggedAccount[] = [
  {
    id: "usr-001",
    username: "john_doe",
    email: "john.doe@example.com",
    violations: 3,
    lastViolation: "2023-05-18T14:22:30Z",
    status: "active",
  },
  {
    id: "usr-002",
    username: "robert_j",
    email: "robert.johnson@example.com",
    violations: 5,
    lastViolation: "2023-05-17T18:05:45Z",
    status: "active",
  },
  {
    id: "usr-003",
    username: "michael_w",
    email: "michael.wilson@example.com",
    violations: 2,
    lastViolation: "2023-05-16T16:42:20Z",
    status: "active",
  },
  {
    id: "usr-004",
    username: "david_brown",
    email: "david.brown@example.com",
    violations: 7,
    lastViolation: "2023-05-15T12:10:05Z",
    status: "suspended",
  },
  {
    id: "usr-005",
    username: "lisa_jones",
    email: "lisa.jones@example.com",
    violations: 4,
    lastViolation: "2023-05-14T09:33:17Z",
    status: "active",
  },
];

const Flagged = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [accounts, setAccounts] = useState<FlaggedAccount[]>(mockAccounts);
  const [selectedAccount, setSelectedAccount] = useState<FlaggedAccount | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const filteredAccounts = accounts.filter(account => 
    account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSuspendAccount = (account: FlaggedAccount) => {
    setSelectedAccount(account);
    setShowConfirmDialog(true);
  };
  
  const confirmSuspend = () => {
    if (selectedAccount) {
      const updatedAccounts = accounts.map(account => 
        account.id === selectedAccount.id 
          ? { ...account, status: "suspended" } 
          : account
      );
      
      setAccounts(updatedAccounts);
      toast.success(`Account ${selectedAccount.username} has been suspended`);
      setShowConfirmDialog(false);
    }
  };
  
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
        <h1 className="text-2xl font-bold">Flagged Accounts</h1>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search accounts..."
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
                  <th className="text-left p-4">Username</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Violations</th>
                  <th className="text-left p-4">Last Violation</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <tr key={account.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {account.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{account.username}</span>
                        </div>
                      </td>
                      <td className="p-4">{account.email}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="rounded-full">
                            {account.violations}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{formatDate(account.lastViolation)}</td>
                      <td className="p-4">
                        <Badge 
                          variant={account.status === "active" ? "outline" : "secondary"}
                          className={account.status === "suspended" ? "bg-gray-200" : ""}
                        >
                          {account.status === "active" ? (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                              Suspended
                            </span>
                          )}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        {account.status === "active" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleSuspendAccount(account)}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-500">Suspended</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      No accounts found matching your search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend this account? This action will prevent the user from uploading new content.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAccount && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-4 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Warning</p>
                  <p className="text-sm text-red-700">
                    This account has {selectedAccount.violations} violations.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Username:</span>
                  <span className="font-medium">{selectedAccount.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{selectedAccount.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Violation:</span>
                  <span className="font-medium">{formatDate(selectedAccount.lastViolation)}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmSuspend}
            >
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Flagged;
