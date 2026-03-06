import { SoilRecord, FarmerProfile } from './types';

const STORAGE_KEYS = {
  RECORDS: 'agriverse_records',
  PROFILE: 'agriverse_profile',
};

export const storage = {
  saveRecord: (record: SoilRecord) => {
    const records = storage.getRecords();
    records.unshift(record);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  },

  updateRecord: (record: SoilRecord) => {
    const records = storage.getRecords();
    const index = records.findIndex(r => r.id === record.id);
    if (index !== -1) {
      records[index] = record;
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    }
  },

  getRecords: (): SoilRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
  },

  saveProfile: (profile: FarmerProfile) => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getProfile: (): FarmerProfile | null => {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  }
};
