export interface Patient {
  id: string;
  bed: string;
  name: string;
  gender: '男' | '女';
  age: number;
  diagnosis: string;
  careLevel: '一级' | '二级' | '三级';
  status: {
    missingAdmissionNote?: boolean;
    needsProgressNote?: boolean;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'voice' | 'card';
  metadata?: any;
}

export interface Draft {
  id: string;
  title: string;
  content: string;
  patientName: string;
  status: 'synced' | 'editing_on_pc' | 'archived';
  updatedAt: number;
}
