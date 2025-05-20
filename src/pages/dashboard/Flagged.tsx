
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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-4 dark:text-gray-300">Username</th>
                  <th className="text-left p-4 dark:text-gray-300">Email</th>
                  <th className="text-left p-4 dark:text-gray-300">Violations</th>
                  <th className="text-left p-4 dark:text-gray-300">Last Violation</th>
                  <th className="text-left p-4 dark:text-gray-300">Status</th>
                  <th className="text-right p-4 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <tr key={account.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            {account.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium dark:text-gray-300">{account.username}</span>
                        </div>
                      </td>
                      <td className="p-4 dark:text-gray-300">{account.email}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="rounded-full">
                            {account.violations}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4 text-sm dark:text-gray-300">{formatDate(account.lastViolation)}</td>
                      <td className="p-4">
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
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {account.status === "active" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                              onClick={() => handleSuspendAccount(account)}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">Suspended</span>
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
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No flagged accounts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
