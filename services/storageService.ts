
import { Report, AppSettings } from '../types';
import { db } from './firebase';
import { collection, doc, getDocs, setDoc, getDoc, query, orderBy, deleteDoc } from 'firebase/firestore';

const DEFAULT_SETTINGS: AppSettings = {
  adminPin: "handbolmolins1944",
  lastUpdated: new Date().toISOString()
};


export const sharedStorage = {
  // --- REPORTS ---
  async fetchAll(): Promise<Report[]> {
    try {
      const reportsCol = collection(db, 'reports');
      const q = query(reportsCol, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const remoteReports = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id // Ensure we use the Firestore document ID if it doesn't match the internal ID
      } as Report));

      // Synchronize internal IDs if necessary
      const standardizedReports = remoteReports.map(r => ({
        ...r,
        id: r.id || Math.random().toString(36).substr(2, 6).toUpperCase()
      }));

      localStorage.setItem("ch_molins_reports_v1", JSON.stringify(standardizedReports));
      return standardizedReports;
    } catch (error) {
      console.error("Firestore fetch error, using local fallback", error);
      const local = localStorage.getItem("ch_molins_reports_v1");
      return local ? JSON.parse(local) : [];
    }
  },

  async fetchReportById(id: string): Promise<Report | null> {
    try {
      const docRef = doc(db, 'reports', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as Report;
      }
      return null;
    } catch (error) {
      console.error("Firestore fetch by ID error", error);
      return null;
    }
  },

  async saveAll(reports: Report[]): Promise<boolean> {
    try {
      // For Firestore, we update/set each document.
      // Note: In a production app with many reports, this should use a WriteBatch.
      const promises = reports.map(report =>
        setDoc(doc(db, 'reports', report.id), report)
      );
      await Promise.all(promises);

      localStorage.setItem("ch_molins_reports_v1", JSON.stringify(reports));
      return true;
    } catch (error) {
      console.error("Firestore save error", error);
      return false;
    }
  },

  async appendReport(report: Report): Promise<void> {
    try {
      // Use setDoc with the existing ID to ensure no duplicates if called twice
      await setDoc(doc(db, 'reports', report.id), report);

      // Update local cache immediately
      const local = localStorage.getItem("ch_molins_reports_v1");
      const current = local ? JSON.parse(local) : [];
      localStorage.setItem("ch_molins_reports_v1", JSON.stringify([report, ...current]));
    } catch (error) {
      console.error("Firestore append error", error);
      // Fallback to local only
      const local = localStorage.getItem("ch_molins_reports_v1");
      const current = local ? JSON.parse(local) : [];
      localStorage.setItem("ch_molins_reports_v1", JSON.stringify([report, ...current]));
    }
  },

  async deleteReport(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'reports', id));
      const local = localStorage.getItem("ch_molins_reports_v1");
      if (local) {
        const current = JSON.parse(local) as Report[];
        localStorage.setItem("ch_molins_reports_v1", JSON.stringify(current.filter(r => r.id !== id)));
      }
      return true;
    } catch (error) {
      console.error("Firestore delete error", error);
      return false;
    }
  },

  // --- SETTINGS (PIN) ---
  async fetchSettings(): Promise<AppSettings> {
    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as AppSettings;
        localStorage.setItem("ch_molins_settings_v1", JSON.stringify(data));
        return data;
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Firestore fetch settings error", error);
      const local = localStorage.getItem("ch_molins_settings_v1");
      return local ? JSON.parse(local) : DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      localStorage.setItem("ch_molins_settings_v1", JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error("Firestore save settings error", error);
      return false;
    }
  }
};
