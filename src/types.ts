export type College = 
  | 'College of Engineering'
  | 'College of Computer Studies'
  | 'College of Business Administration'
  | 'College of Education'
  | 'Library'
  | 'Administration'
  | 'Accounting Office'
  | 'HR Office'
  | 'Registrar'
  | 'Other';

export type UserCategory = 'Student' | 'Faculty' | 'Staff' | 'Employee';

export type VisitReason = 
  | 'Reading'
  | 'Research'
  | 'Computer Use'
  | 'Studying'
  | 'Printing'
  | 'Borrowing Book'
  | 'Other';

export type UserRole = 'admin' | 'student';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  name?: string;
  college?: College;
  category?: UserCategory;
  photoURL?: string;
}

export interface VisitorLog {
  id: string;
  name: string;
  email: string;
  college: College;
  category: UserCategory;
  reason: VisitReason;
  otherReason?: string;
  timestamp: Date;
  status?: 'active' | 'deleted';
  deletedAt?: Date | null;
  deletedBy?: string | null;
  photoURL?: string;
}

export interface BackupRecord {
  id: string;
  backupDate: Date;
  createdAt: Date;
  recordCount: number;
  data: any[];
}

export interface KioskState {
  name: string;
  email: string;
  college?: College;
  category?: UserCategory;
  reason?: VisitReason;
  otherReason?: string;
}
