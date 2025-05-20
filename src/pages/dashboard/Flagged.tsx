
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  CalendarClock, 
  AlertTriangle,
  Trash2,
  Ban,
  UserX,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

// Type for flagged accounts
type FlaggedAccount = {
  id: string;
  username: string;
  email: string;
  violations: number;
  lastViolation: string;
  status: 'active' | 'suspended' | 'banned';
  violationType: string;
};

// Mock data for flagged accounts
const INITIAL_FLAGGED_ACCOUNTS: FlaggedAccount[] = [
  {
    id: 'usr-123456',
    username: 'user1',
    email: 'user1@example.com',
    violations: 3,
    lastViolation: '2024-04-15T10:30:00Z',
    status: 'active',
    violationType: 'hate_speech'
  },
  {
    id: 'usr-234567',
    username: 'user2',
    email: 'user2@example.com',
    violations: 5,
    lastViolation: '2024-04-13T14:20:00Z',
    status: 'suspended',
    violationType: 'violence'
  },
  {
    id: 'usr-345678',
    username: 'user3',
    email: 'user3@example.com',
    violations: 10,
    lastViolation: '2024-04-10T09:15:00Z',
    status: 'banned',
    violationType: 'policy_violation'
  }
];

const FlaggedPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [flaggedAccounts, setFlaggedAccounts] = useState<FlaggedAccount[]>(INITIAL_FLAGGED_ACCOUNTS);
  
  // Function to add a flagged account (exposed to Upload component)
  const addFlaggedAccount = (newAccount: FlaggedAccount) => {
    // Check if the account already exists
    const existingAccountIndex = flaggedAccounts.findIndex(account => account.email === newAccount.email);
    
    if (existingAccountIndex >= 0) {
      // Update existing account
      const updatedAccounts = [...flaggedAccounts];
      updatedAccounts[existingAccountIndex] = {
        ...updatedAccounts[existingAccountIndex],
        violations: updatedAccounts[existingAccountIndex].violations + 1,
        lastViolation: newAccount.lastViolation,
        violationType: newAccount.violationType
      };
      setFlaggedAccounts(updatedAccounts);
    } else {
      // Add new account
      setFlaggedAccounts(prev => [newAccount, ...prev]);
    }
  };

  // Expose function to window for Upload component
  useEffect(() => {
    (window as any).addFlaggedAccount = addFlaggedAccount;
    
    return () => {
      delete (window as any).addFlaggedAccount;
    };
  }, [flaggedAccounts]);
  
  const handleDeleteAccount = (id: string) => {
    setFlaggedAccounts(flaggedAccounts.filter(account => account.id !== id));
    toast.success("Account removed from flagged list");
  };
  
  const handleUpdateStatus = (id: string, status: 'active' | 'suspended' | 'banned') => {
    setFlaggedAccounts(flaggedAccounts.map(account => 
      account.id === id ? { ...account, status } : account
    ));
    
    toast.success(`Account status updated to ${status}`);
  };
  
  // Filter accounts based on search query
  const filteredAccounts = flaggedAccounts.filter(account => 
    account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'suspended':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'banned':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold dark:text-white">Flagged Accounts</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Accounts with Content Violations</CardTitle>
          <CardDescription>
            Manage accounts that have been flagged for posting content that violates platform policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by username or email"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Violations</TableHead>
                  <TableHead className="hidden md:table-cell">Last Violation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{account.username}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{account.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                          <span>{account.violations}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <CalendarClock className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{formatDate(account.lastViolation)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(account.status)}>
                          {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {account.status !== 'banned' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(account.id, 'banned')}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          {account.status !== 'suspended' && account.status !== 'banned' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(account.id, 'suspended')}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                          {account.status !== 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(account.id, 'active')}
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove the account from the flagged list, but won't delete the actual user account.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteAccount(account.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      <div className="flex flex-col items-center">
                        <ShieldAlert className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                        <p className="mt-2 text-gray-500 dark:text-gray-400">No flagged accounts found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredAccounts.length} of {flaggedAccounts.length} accounts
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FlaggedPage;
