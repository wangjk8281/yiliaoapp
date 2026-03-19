export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: '男' | '女';
  bedNo: string;
  department: string;
  admissionDate: string;
  diagnosis: string;
  status: '稳定' | '危重' | '待手术';
}

export interface MedicalDoc {
  id: string;
  patientId: string;
  type: string;
  title: string;
  content: string;
  status: 'draft' | 'pending' | 'signed';
  createdAt: string;
  updatedAt: string;
  qcScore?: number;
}

export interface QCResult {
  dimension: string;
  issue: string;
  severity: 'P0' | 'P1' | 'P2';
  suggestion: string;
}
