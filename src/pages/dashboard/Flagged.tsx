
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, AlertCircle, UserX, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FlaggedAccount = {
  id: string;
  username: string;
  email: string;
  violations: number;
  lastViolation: string;
  status: "active" | "suspended";
};

const Flagged = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [accounts, setAccounts] = useState<FlaggedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<FlaggedAccount | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Add sample data for testing if none exists
  useEffect(() => {
    if (accounts.length === 0) {
      const sampleData: FlaggedAccount[] = [
        {
          id: "1",
          username: "suspicious_user",
          email: "suspicious@example.com",
          violations: 3,
          lastViolation: new Date().toISOString(),
          status: "active"
        },
        {
          id: "2",
          username: "banned_account",
          email: "banned@example.com",
          violations: 5,
          lastViolation: new Date(Date.now() - 86400000).toISOString(),
          status: "suspended"
        }
      ];
      setAccounts(sampleData);
    }
  }, [accounts.length]);
  
  // Parse search input safely and filter accounts
  const filteredAccounts = accounts.filter(account => {
    const searchTermLower = searchTerm.toLowerCase().trim();
    return account.username.toLowerCase().includes(searchTermLower) ||
           account.email.toLowerCase().includes(searchTermLower);
  });
  
  const handleSuspendAccount = (account: FlaggedAccount) => {
    setSelectedAccount(account);
    setShowConfirmDialog(true);
  };
  
  const confirmSuspend = () => {
    if (selectedAccount) {
      const updatedAccounts = accounts.map(account => 
        account.id === selectedAccount.id 
          ? { ...account, status: "suspended" as const } 
          : account
      );
      
      setAccounts(updatedAccounts);
      toast.success(`Account ${selectedAccount.username} has been suspended`);
      setShowConfirmDialog(false);
    }
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(account => account.id !== id));
    toast.success("Account removed from flagged list");
    setConfirmDelete(null);
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Method to add a new flagged account (will be called when a flagged report is linked to an account)
  const addFlaggedAccount = (account: FlaggedAccount) => {
    // Check if account already exists
    const exists = accounts.some(a => a.id === account.id);
    if (!exists) {
      setAccounts(prevAccounts => [account, ...prevAccounts]);
    } else {
      // Update violations count for existing account
      setAccounts(prevAccounts => prevAccounts.map(a => 
        a.id === account.id 
          ? { ...a, violations: a.violations + 1, lastViolation: account.lastViolation }
          : a
      ));
    }
  };

  // Expose the addFlaggedAccount method to window so it can be called from other components
  useEffect(() => {
    (window as any).addFlaggedAccount = addFlaggedAccount;
    return () => {
      delete (window as any).addFlaggedAccount;
    };
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Flagged Accounts</h1>
        
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Violations</TableHead>
                  <TableHead>Last Violation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            {account.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium dark:text-gray-300">{account.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="dark:text-gray-300">{account.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="rounded-full">
                            {account.violations}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm dark:text-gray-300">{formatDate(account.lastViolation)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={account.status === "active" ? "outline" : "secondary"}
                          className={account.status === "suspended" ? "bg-gray-200 dark:bg-gray-700" : ""}
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
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {account.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                              onClick={() => handleSuspendAccount(account)}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                            onClick={() => setConfirmDelete(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-6">
                      No flagged accounts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Suspension Confirmation Dialog */}
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
              <div className="flex items-center gap-3 mb-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-300">Warning</p>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    This account has {selectedAccount.violations} violations.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Username:</span>
                  <span className="font-medium dark:text-gray-300">{selectedAccount.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="font-medium dark:text-gray-300">{selectedAccount.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last Violation:</span>
                  <span className="font-medium dark:text-gray-300">{formatDate(selectedAccount.lastViolation)}</span>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove From Flagged List</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this account from the flagged list? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => confirmDelete && handleDeleteAccount(confirmDelete)}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Flagged;
