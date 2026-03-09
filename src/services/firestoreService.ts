import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  getDoc,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { VisitorLog, College, VisitReason, AppUser, UserRole, UserCategory } from "../types";

const LOGS_COLLECTION = "visitor_logs";
const BLOCKED_COLLECTION = "blocked_users";
const USERS_COLLECTION = "users";

const cleanData = (data: any) => {
  const clean: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  });
  return clean;
};

export const addVisitorLog = async (log: Omit<VisitorLog, "id" | "timestamp">) => {
  try {
    await addDoc(collection(db, LOGS_COLLECTION), {
      ...cleanData(log),
      timestamp: Timestamp.now(),
      status: 'active',
    });
  } catch (error) {
    console.error("Error adding visitor log: ", error);
    throw error;
  }
};

export const subscribeToLogs = (callback: (logs: VisitorLog[]) => void) => {
  // Remove orderBy to avoid requiring a Firestore index, sort on client instead
  const q = query(collection(db, LOGS_COLLECTION));
  
  return onSnapshot(q, 
    (querySnapshot) => {
      const logs: VisitorLog[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Robust timestamp handling
        let date: Date;
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
          date = data.timestamp.toDate();
        } else if (data.timestamp instanceof Date) {
          date = data.timestamp;
        } else {
          date = new Date(); // Fallback
        }

        logs.push({
          id: doc.id,
          name: data.name || 'Unknown',
          email: data.email || 'No Email',
          college: (data.college || 'Other') as College,
          category: (data.category || 'Student') as UserCategory,
          reason: (data.reason || 'Other') as VisitReason,
          otherReason: data.otherReason,
          timestamp: date,
          status: data.status || 'active',
          deletedAt: data.deletedAt ? data.deletedAt.toDate() : null,
          deletedBy: data.deletedBy || null,
          photoURL: data.photoURL || null,
        });
      });
      
      // Sort on client side: Newest first
      const sortedLogs = logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      callback(sortedLogs);
    },
    (error: any) => {
      if (error.code !== 'permission-denied') {
        console.error("Logs listener error (check if you are an admin):", error);
      }
      // Call the callback with an empty array to stop loading states
      callback([]);
    }
  );
};

export const subscribeToBlockedUsers = (callback: (emails: string[]) => void) => {
  return onSnapshot(collection(db, BLOCKED_COLLECTION), 
    (querySnapshot) => {
      const emails: string[] = [];
      querySnapshot.forEach((doc) => {
        emails.push(doc.id); // We use email as the document ID
      });
      callback(emails);
    },
    (error: any) => {
      if (error.code !== 'permission-denied') {
        console.error("Blocked users listener error:", error);
      }
    }
  );
};

export const toggleBlockUser = async (email: string, isBlocked: boolean) => {
  try {
    const docRef = doc(db, BLOCKED_COLLECTION, email);
    if (isBlocked) {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, { blockedAt: Timestamp.now() });
    }
  } catch (error) {
    console.error("Error toggling block status: ", error);
    throw error;
  }
};

// --- User Management ---

export const getAppUser = async (uid: string): Promise<AppUser | null> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        uid: docSnap.id,
        email: data.email,
        role: data.role as UserRole,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
        name: data.name,
        college: data.college as College,
        category: data.category as UserCategory,
        photoURL: data.photoURL,
      };
    }
    return null;
  } catch (error: any) {
    // Only log if it's not a permission error during initial check
    if (error.code !== 'permission-denied') {
      console.error("Error getting user data: ", error);
    }
    return null;
  }
};

export const createAppUser = async (uid: string, email: string, role: UserRole = 'student') => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(docRef, {
      email,
      role,
      createdAt: Timestamp.now(),
    });
  } catch (error: any) {
    if (error.code !== 'permission-denied') {
      console.error("Error creating user data: ", error);
    }
    throw error;
  }
};

export const subscribeToAppUser = (uid: string, callback: (user: AppUser | null) => void) => {
  if (!uid) {
    callback(null);
    return () => {};
  }
  const docRef = doc(db, USERS_COLLECTION, uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        uid: docSnap.id,
        email: data.email,
        role: data.role as UserRole,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
        name: data.name,
        college: data.college as College,
        category: data.category as UserCategory,
        photoURL: data.photoURL,
      });
    } else {
      callback(null);
    }
  }, (error: any) => {
    if (error.code !== 'permission-denied') {
      console.error("User subscription error:", error);
    }
    callback(null);
  });
};

export const updateAppUser = async (uid: string, data: Partial<AppUser>) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const updateData: any = cleanData(data);
    if (data.createdAt) {
      updateData.createdAt = Timestamp.fromDate(data.createdAt);
    }
    await setDoc(docRef, updateData, { merge: true });
  } catch (error) {
    console.error("Error updating user data: ", error);
    throw error;
  }
};

// --- Admin Enhancements ---

const ADMIN_LOGS_COLLECTION = "admin_logs";

export const logAdminAction = async (adminEmail: string, action: string, details: any) => {
  const currentUser = auth.currentUser;
  console.log(`[AdminLog] Action: ${action}, Email: ${adminEmail}, UID: ${currentUser?.uid}`);
  
  try {
    const cleanedDetails = details ? cleanData(details) : {};
    const docRef = await addDoc(collection(db, ADMIN_LOGS_COLLECTION), {
      adminEmail: adminEmail || 'unknown',
      action,
      details: cleanedDetails,
      timestamp: serverTimestamp(),
      userId: currentUser?.uid || 'unauthenticated'
    });
    console.log(`[AdminLog] Success! ID: ${docRef.id}`);
  } catch (error: any) {
    console.error("[AdminLog] Permission Error Details:", {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
  }
};

export const subscribeToAllUsers = (callback: (users: AppUser[]) => void) => {
  const q = query(collection(db, USERS_COLLECTION));
  return onSnapshot(q, (querySnapshot) => {
    const users: AppUser[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        email: data.email,
        role: data.role as UserRole,
        createdAt: (data.createdAt as Timestamp).toDate(),
        name: data.name,
        college: data.college as College,
        category: data.category as UserCategory,
        photoURL: data.photoURL,
      });
    });
    callback(users);
  }, (error: any) => {
    if (error.code !== 'permission-denied') {
      console.error("All users subscription error:", error);
    }
    callback([]);
  });
};

// --- Soft Delete & Recycle Bin ---

export const softDeleteVisitorLog = async (logId: string, adminEmail: string) => {
  try {
    const docRef = doc(db, LOGS_COLLECTION, logId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const logData = docSnap.data();
      const logToBackup = { 
        id: docSnap.id, 
        ...logData, 
        timestamp: logData.timestamp?.toDate() 
      };

      await updateDoc(docRef, {
        status: 'deleted',
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: adminEmail || 'unknown'
      });
      
      await logAdminAction(adminEmail, 'soft_delete', { logId });
      
      // Automatic backup of the log being soft-deleted
      await createBackup([logToBackup as any], adminEmail, 'auto');
    }
  } catch (error) {
    console.error("Error soft deleting log: ", error);
    throw error;
  }
};

// Keep softDeleteLog as alias for backward compatibility if needed, but the prompt asks for softDeleteVisitorLog
export const softDeleteLog = softDeleteVisitorLog;

export const restoreLog = async (logId: string, adminEmail: string) => {
  try {
    const docRef = doc(db, LOGS_COLLECTION, logId);
    await updateDoc(docRef, {
      status: 'active',
      isDeleted: false,
      deletedAt: null,
      deletedBy: null
    });
    await logAdminAction(adminEmail, 'restore_log', { logId });
  } catch (error) {
    console.error("Error restoring log: ", error);
    throw error;
  }
};

export const permanentDeleteLog = async (logId: string, adminEmail: string) => {
  try {
    const docRef = doc(db, LOGS_COLLECTION, logId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const logData = docSnap.data();
      const logToBackup = { 
        id: docSnap.id, 
        ...logData, 
        timestamp: logData.timestamp?.toDate() 
      };
      
      // Requirement: Before any permanent delete, create a backup snapshot of the logs being deleted.
      await createBackup([logToBackup as any], adminEmail, 'auto');
      
      await deleteDoc(docRef);
      await logAdminAction(adminEmail, 'permanent_delete', { logId });
    }
  } catch (error) {
    console.error("Error permanently deleting log: ", error);
    throw error;
  }
};

export const clearAllLogs = async (adminEmail: string, logs: VisitorLog[]) => {
  try {
    const activeLogs = logs.filter(l => (l.status || 'active') === 'active');
    
    // Firestore batch limit is 500
    const chunks = [];
    for (let i = 0; i < activeLogs.length; i += 500) {
      chunks.push(activeLogs.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(log => {
        const docRef = doc(db, LOGS_COLLECTION, log.id);
        batch.update(docRef, {
          status: 'deleted',
          isDeleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: adminEmail || 'unknown'
        });
      });
      await batch.commit();
    }
    
    await logAdminAction(adminEmail, 'clear_all_logs', { count: activeLogs.length });
    
    // Trigger backup after delete
    await createBackup(activeLogs, adminEmail, 'auto');
  } catch (error) {
    console.error("Error clearing all logs: ", error);
    throw error;
  }
};

// Keep softDeleteAllLogs for compatibility
export const softDeleteAllLogs = clearAllLogs;

export const bulkDeleteLogs = async (adminEmail: string, logs: VisitorLog[]) => {
  try {
    // Firestore batch limit is 500
    const chunks = [];
    for (let i = 0; i < logs.length; i += 500) {
      chunks.push(logs.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(log => {
        const docRef = doc(db, LOGS_COLLECTION, log.id);
        batch.update(docRef, {
          status: 'deleted',
          isDeleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: adminEmail || 'unknown'
        });
      });
      await batch.commit();
    }
    
    await logAdminAction(adminEmail, 'bulk_delete_logs', { count: logs.length, logIds: logs.map(l => l.id) });
    
    // Trigger backup after delete
    await createBackup(logs, adminEmail, 'auto');
  } catch (error) {
    console.error("Error bulk deleting logs: ", error);
    throw error;
  }
};

// --- Backup System ---

const BACKUPS_COLLECTION = "visitLogs_backup";

export const createBackup = async (logs: VisitorLog[], adminEmail: string, type: 'auto' | 'manual' = 'manual') => {
  try {
    const cleanedLogs = logs.map(l => {
      const cleaned = cleanData(l);
      // Ensure timestamp is a Firestore Timestamp
      if (cleaned.timestamp instanceof Date) {
        cleaned.timestamp = Timestamp.fromDate(cleaned.timestamp);
      } else if (cleaned.timestamp && typeof cleaned.timestamp.toDate === 'function') {
        // Already a timestamp or similar
      } else if (!cleaned.timestamp) {
        cleaned.timestamp = Timestamp.now();
      }
      
      // Handle other potential Date objects
      if (cleaned.deletedAt instanceof Date) {
        cleaned.deletedAt = Timestamp.fromDate(cleaned.deletedAt);
      }
      
      return cleaned;
    });

    await addDoc(collection(db, BACKUPS_COLLECTION), {
      backupDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      recordCount: logs.length,
      triggeredBy: adminEmail || 'unknown',
      type: type,
      data: cleanedLogs
    });
    await logAdminAction(adminEmail, 'backup_created', { recordCount: logs.length, type });
  } catch (error) {
    console.error("Error creating backup: ", error);
    throw error;
  }
};

export const subscribeToBackups = (callback: (backups: any[]) => void) => {
  const colRef = collection(db, BACKUPS_COLLECTION);
  
  return onSnapshot(colRef, 
    (querySnapshot) => {
      const backups: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        backups.push({
          id: doc.id,
          ...data,
          backupDate: data.backupDate?.toDate() || null,
          createdAt: data.createdAt?.toDate() || null
        });
      });
      // Sort on client to avoid index requirement
      backups.sort((a, b) => {
        const dateA = a.backupDate?.getTime() || 0;
        const dateB = b.backupDate?.getTime() || 0;
        return dateB - dateA;
      });
      callback(backups);
    },
    (error) => {
      console.error("[BackupSub] Subscription error:", error.code, error.message);
      callback([]);
    }
  );
};

export const restoreBackup = async (backupId: string, adminEmail: string) => {
  try {
    const docRef = doc(db, BACKUPS_COLLECTION, backupId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const backupData = docSnap.data();
      const logsToRestore = backupData.data || [];
      
      // Firestore batch limit is 500
      const chunks = [];
      for (let i = 0; i < logsToRestore.length; i += 500) {
        chunks.push(logsToRestore.slice(i, i + 500));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((log: any) => {
          const logDocRef = doc(db, LOGS_COLLECTION, log.id);
          
          // Data Integrity: Convert stringified dates back into Firestore Timestamps
          let timestamp = log.timestamp;
          if (timestamp && typeof timestamp === 'object') {
            if (timestamp.seconds !== undefined) {
              timestamp = new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0);
            } else if (timestamp instanceof Date) {
              timestamp = Timestamp.fromDate(timestamp);
            }
          } else if (typeof timestamp === 'string') {
            timestamp = Timestamp.fromDate(new Date(timestamp));
          }

          // Restore as active, even if it was deleted when backed up
          batch.set(logDocRef, {
            ...log,
            timestamp: timestamp,
            status: 'active',
            isDeleted: false,
            restoredAt: serverTimestamp(),
            restoredBy: adminEmail
          });
        });
        await batch.commit();
      }
      
      await logAdminAction(adminEmail, 'restore_backup', { backupId, recordCount: logsToRestore.length });
    }
  } catch (error) {
    console.error("Error restoring backup: ", error);
    throw error;
  }
};

export const updateUserRole = async (uid: string, newRole: UserRole, adminEmail: string) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(docRef, {
      role: newRole
    });
    await logAdminAction(adminEmail, 'UPDATE_USER_ROLE', { targetUid: uid, newRole });
  } catch (error) {
    console.error("Error updating user role: ", error);
    throw error;
  }
};

export const fetchAllUsers = async (): Promise<AppUser[]> => {
  try {
    const q = query(collection(db, USERS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const users: AppUser[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        email: data.email,
        role: data.role as UserRole,
        createdAt: (data.createdAt as Timestamp).toDate(),
        name: data.name,
        college: data.college as College,
        category: data.category as UserCategory,
        photoURL: data.photoURL,
      });
    });
    return users;
  } catch (error) {
    console.error("Error fetching all users: ", error);
    return [];
  }
};

export const promoteUserToAdmin = async (uid: string, adminEmail: string) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(docRef, {
      role: 'admin'
    });
    await logAdminAction(adminEmail, 'PROMOTE_USER_TO_ADMIN', { targetUid: uid });
  } catch (error) {
    console.error("Error promoting user to admin: ", error);
    throw error;
  }
};
