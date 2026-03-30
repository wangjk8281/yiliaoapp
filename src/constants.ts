import { Patient, Draft } from './types';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    bed: '3床',
    name: '张三',
    gender: '男',
    age: 45,
    diagnosis: '急性心肌梗死',
    careLevel: '一级',
    status: { needsProgressNote: true }
  },
  {
    id: '2',
    bed: '5床',
    name: '李四',
    gender: '男',
    age: 62,
    diagnosis: '肺部感染',
    careLevel: '二级',
    status: { missingAdmissionNote: true }
  },
  {
    id: '3',
    bed: '12床',
    name: '王五',
    gender: '女',
    age: 28,
    diagnosis: '急性阑尾炎术后',
    careLevel: '三级',
    status: {}
  }
];

export const MOCK_DRAFTS: Draft[] = [
  {
    id: 'd1',
    title: '3床 张三 查房记录',
    content: '患者主诉昨夜睡眠佳，无明显不适。专科体征：切口敷料见少许黄色渗出...',
    patientName: '张三',
    status: 'synced',
    updatedAt: Date.now() - 3600000
  }
];
