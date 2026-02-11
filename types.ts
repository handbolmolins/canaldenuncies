
export enum ViolenceType {
  FISICA = 'Violència Física',
  PSICOLOGICA = 'Violència Psicològica/Emocional',
  SEXUAL = 'Violència Sexual',
  ASSETJAMENT = 'Assetjament (Bullying)',
  CIBER = 'Ciberassetjament',
  NEGLIGENCIA = 'Negligència/Abandonament',
  AUTORITAT = "Abús d'Autoritat",
  DISCRIMINACIO = 'Discriminació/LGTBIfòbia',
  ALTRES = 'Altres'
}

export enum ReporterType {
  VICTIMA = 'La mateixa víctima (Menor)',
  PROGENITOR = 'Pare / Mare / Tutor',
  ENTRENADOR = 'Staff Tècnic / Entrenador',
  JUGADOR = 'Company / Altre jugador',
  DIRECTIU = 'Directiu / Coordinador',
  TESTIMONI = 'Testimoni extern',
  ALTRE = 'Altre'
}

export interface AppSettings {
  adminPin: string;
  lastUpdated: string;
}

export interface AIAnalysis {
  suggestedTypes: string[];
  severity: 'Lleu' | 'Greu';
  reasoning: string;
  immediateActions: string[];
}

export interface Report {
  id: string;
  createdAt: string;
  informant: {
    name: string;
    dni?: string;
    email: string;
    phone: string;
    type: ReporterType;
    isAnonymous: boolean;
  };
  victim: {
    name: string;
    age: string;
    gender: 'Home' | 'Dona' | 'Altre' | 'No especificat';
    category: string;
    entity: string;
  };
  involved: {
    accusedName: string;
    accusedRelation: string;
  };
  facts: {
    date: string;
    time: string;
    location: string;
    violenceType: ViolenceType[];
    description: string;
    witnesses: string;
    isRecurring: boolean;
    isKnownByOthers: boolean;
  };
  aiAnalysis?: AIAnalysis;
  attachments?: string[];
  status: 'Pendent' | 'En Procés' | 'Resolt' | 'Urgència';
  gdprAccepted: boolean;
  requestMeeting: boolean;
}

export interface Indicator {
  category: string;
  items: string[];
}
