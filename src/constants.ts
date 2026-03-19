import { Patient } from './types';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P001',
    name: '张三',
    age: 54,
    gender: '男',
    bedNo: '12-01',
    department: '心血管内科',
    admissionDate: '2024-03-15',
    diagnosis: '急性心肌梗死',
    status: '危重'
  },
  {
    id: 'P002',
    name: '李四',
    age: 42,
    gender: '女',
    bedNo: '12-05',
    department: '心血管内科',
    admissionDate: '2024-03-18',
    diagnosis: '高血压 3级',
    status: '稳定'
  },
  {
    id: 'P003',
    name: '王五',
    age: 68,
    gender: '男',
    bedNo: '12-08',
    department: '心血管内科',
    admissionDate: '2024-03-10',
    diagnosis: '冠心病',
    status: '待手术'
  }
];

export const DOC_TYPES = [
  '入院记录',
  '病程记录',
  '出院小结',
  '手术记录',
  '护理记录'
];
