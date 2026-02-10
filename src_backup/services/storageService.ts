
import { Report, AppSettings } from '../types';

const BUCKET_ID = "ch_molins_lopivi_v1_882341";
const REPORTS_URL = `https://kvdb.io/${BUCKET_ID}/reports_db`;
const SETTINGS_URL = `https://kvdb.io/${BUCKET_ID}/settings_db`;

const DEFAULT_SETTINGS: AppSettings = {
  adminPin: "handbolmolins1944",
  lastUpdated: new Date().toISOString()
};

export const sharedStorage = {
  // --- REPORTS ---
  async fetchAll(): Promise<Report[]> {
    const localData = localStorage.getItem("ch_molins_reports_v1");
    const localReports: Report[] = localData ? JSON.parse(localData) : [];

    try {
      const response = await fetch(REPORTS_URL);
      if (response.ok) {
        const data = await response.json();
        const remoteReports = Array.isArray(data) ? data : [];
        if (remoteReports.length >= localReports.length) {
          localStorage.setItem("ch_molins_reports_v1", JSON.stringify(remoteReports));
          return remoteReports;
        }
      }
    } catch (error) {
      console.error("Cloud storage error, using local fallback");
    }
    return localReports;
  },

  async saveAll(reports: Report[]): Promise<boolean> {
    localStorage.setItem("ch_molins_reports_v1", JSON.stringify(reports));
    try {
      const response = await fetch(REPORTS_URL, {
        method: 'POST',
        body: JSON.stringify(reports),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      console.error("Could not sync to cloud");
      return false;
    }
  },

  async appendReport(report: Report): Promise<void> {
    const current = await this.fetchAll();
    const updated = [report, ...current];
    await this.saveAll(updated);
  },

  // --- SETTINGS (PIN) ---
  async fetchSettings(): Promise<AppSettings> {
    try {
      const response = await fetch(SETTINGS_URL);
      if (!response.ok) return DEFAULT_SETTINGS;
      const data = await response.json();
      return data && data.adminPin ? data : DEFAULT_SETTINGS;
    } catch (error) {
      const local = localStorage.getItem("ch_molins_settings_v1");
      return local ? JSON.parse(local) : DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      const response = await fetch(SETTINGS_URL, {
        method: 'POST',
        body: JSON.stringify(settings),
        headers: { 'Content-Type': 'application/json' }
      });
      localStorage.setItem("ch_molins_settings_v1", JSON.stringify(settings));
      return response.ok;
    } catch (error) {
      localStorage.setItem("ch_molins_settings_v1", JSON.stringify(settings));
      return false;
    }
  }
};
