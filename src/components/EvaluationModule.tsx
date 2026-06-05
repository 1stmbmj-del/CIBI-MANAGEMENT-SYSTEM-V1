import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../types';
import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { 
  Award, 
  ClipboardCheck, 
  Printer, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export interface EvaluationRecord {
  id?: string;
  employeeId: string;
  employeeName: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: string;
  type: 'self' | 'superior';
  dateHired: string;
  position: string;
  status: string;
  department: string;
  ratingPeriod: string;
  classification: string;
  otherClassification: string;
  ratings: Record<string, number>;
  strongPoints: string;
  weakPoints: string;
  trainingRecommendation: string;
  absences: string;
  tardiness: string;
  undertime: string;
  disciplinaryActions: string;
  typeOfViolation: string;
  createdAt: string;
}

interface Criterion {
  id: number;
  title: string;
  description: string;
  isManagerOnly?: boolean;
}

const CRITERIA: Criterion[] = [
  {
    id: 1,
    title: "JOB KNOWLEDGE",
    description: "May kakayahang gawin ang trabahong ibinigay ng agarang nakatataas na mayroong kaunting pangangasiwa."
  },
  {
    id: 2,
    title: "PRODUCTIVITY",
    description: "Nagtatrabaho ng maayos upang makamit ang magandang resulta sa itinakdang petsa o oras."
  },
  {
    id: 3,
    title: "QUALITY OF WORK",
    description: "Ang resulta ng trabaho ay mayroong mataas na kalidad at hindi kailangan bantayan ang pagtatrabaho."
  },
  {
    id: 4,
    title: "COOPERATION",
    description: "Marunong sumunod sa mga patakaran at proseso na itinadhana ng kumpanya. Pagtatrabaho na may layuning kaisa sa lahat para sa mas ikaaayos o ikagaganda ng proyekto."
  },
  {
    id: 5,
    title: "DEPENDABILITY",
    description: "Kayang gumawa ng maayos na trabaho kahit wala ang agarang nakatataas."
  },
  {
    id: 6,
    title: "ADAPTABILITY",
    description: "Marunong umangkop sa mga pagbabago ng mga proseso, patakaran, at mga programa ng kumpanya."
  },
  {
    id: 7,
    title: "SAFETY AND HOUSEKEEPING",
    description: "Malinis sa lugar ng pagtatrabaho; Masinop at maayos sa mga files; Marunong sumunod sa mga safety rules and legal requirements katulad ng palaging pagsusuot ng face mask, pagsusuot ng company id, at pagsusuot ng helmet habang nagmamaneho ng motorsiklo."
  },
  {
    id: 8,
    title: "RESPONSIBILITY",
    description: "May kamalayan sa pananagutan sa mga trabaho o proyekto na iniaatas sakanya; Maingat sa mga bagay na ipinagkatiwala ng kumpanya katulad ng mga laptop o computer."
  },
  {
    id: 9,
    title: "INITIATIVE",
    description: "Kakayahang magpasimula ng mga paraan na makakabuti sa pag-ayos ng isang proseso. Gumagawa ng paraan para matapos o magawa ang assignment na ibinigay sa kanya."
  },
  {
    id: 10,
    title: "ATTITUDE TOWARDS ATTENDANCE",
    description: "Hindi madalas lumiban sa trabaho. Laging tama sa oras na itinakda ng kumpanya ang pagpasok at may pagkukusang i-extend ang oras kung kinakailangan."
  },
  {
    id: 11,
    title: "LEADERSHIP",
    description: "Kakayahang mag-motivate ng kanyang tauhan na nasasakupan para sa mas ikauunlad ng team, ng karera at ng pagpapabuti sa sarili.",
    isManagerOnly: true
  },
  {
    id: 12,
    title: "PLANNING AND ORGANIZING",
    description: "Marunong gumawa ng mga plano para sa pagpapabuti ng team; Nasusubaybayan ang pagkamit ng mga plano.",
    isManagerOnly: true
  },
  {
    id: 13,
    title: "JUDGMENT",
    description: "Kakayahang magbigay ng matinong konklusyon na naaayon sa Akkun Code of Conduct; Walang kinikilingan sa lahat ng pagkakataon.",
    isManagerOnly: true
  },
  {
    id: 14,
    title: "ANALYTICAL ABILITY",
    description: "Marunong mangalap ng data para maging basehan sa pag-aanalyze kung bakit bumabababa ang performance ng team o kung saan at ano ang naging dahilan ng mga insidenteng nangyari.",
    isManagerOnly: true
  },
  {
    id: 15,
    title: "DEVELOPING SUBORDINATES",
    description: "Kakayahang maghubog ng mga myembro ng team at gawin silang mas mahusay pa.",
    isManagerOnly: true
  }
];

export default function EvaluationModule({ user }: { user: UserProfile }) {
  const isAdmin = user.role === 'admin';
  
  // Lists & data
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View states
  const [currentTab, setCurrentTab] = useState<'list' | 'create_self' | 'create_superior'>('list');
  const [selectedEval, setSelectedEval] = useState<EvaluationRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'self' | 'superior'>('all');
  
  // Evaluation formulation state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [ratingPeriod, setRatingPeriod] = useState('January 01, 2025 to March 31, 2025');
  const [dateHired, setDateHired] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState('Regular');
  const [department, setDepartment] = useState('CI & Customer Service');
  const [classification, setClassification] = useState('Office Staff');
  const [otherClassification, setOtherClassification] = useState('');
  
  // Ratings state for criteria
  const [ratings, setRatings] = useState<Record<string, number>>({});
  
  // Areas
  const [strongPoints, setStrongPoints] = useState('');
  const [weakPoints, setWeakPoints] = useState('');
  const [trainingRecommendation, setTrainingRecommendation] = useState('');
  
  // HR section (Only filled by HR/Admin)
  const [absences, setAbsences] = useState('None');
  const [tardiness, setTardiness] = useState('None');
  const [undertime, setUndertime] = useState('None');
  const [disciplinaryActions, setDisciplinaryActions] = useState('None');
  const [typeOfViolation, setTypeOfViolation] = useState('None');
  
  // Modal states
  const [isEditingHR, setIsEditingHR] = useState(false);
  const [hrEditId, setHrEditId] = useState<string | null>(null);

  // Initialize fields for self-eval
  useEffect(() => {
    if (currentTab === 'create_self') {
      setSelectedEmployeeId(user.id);
      setPosition(user.role === 'admin' ? 'Administrator' : user.role === 'coordinator' ? 'CI Coordinator' : 'CIBI Officer');
      // Set default classification
      if (user.role === 'admin') {
        setClassification('Manager');
      } else if (user.role === 'coordinator') {
        setClassification('Supervisor / Head');
      } else {
        setClassification('Office Staff');
      }
      
      // Pre-fill rating dictionary with 0s
      const initial: Record<string, number> = {};
      CRITERIA.forEach(c => {
        initial[c.id.toString()] = 0;
      });
      setRatings(initial);
      
      // Clear fields
      setStrongPoints('');
      setWeakPoints('');
      setTrainingRecommendation('');
      setAbsences('None');
      setTardiness('None');
      setUndertime('None');
      setDisciplinaryActions('None');
      setTypeOfViolation('None');
    }
  }, [currentTab, user]);

  // Load real data from Firestore
  useEffect(() => {
    setLoading(true);
    // Listen to all evaluations if admin, else only own evaluations
    const evaluationsCol = collection(db, 'evaluations');
    const qEval = isAdmin 
      ? query(evaluationsCol, orderBy('createdAt', 'desc'))
      : query(evaluationsCol, where('employeeId', '==', user.id), orderBy('createdAt', 'desc'));
      
    const unsubEval = onSnapshot(qEval, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EvaluationRecord[];
      setEvaluations(records);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'evaluations');
    });

    // If admin, load system users to allow superior evaluations
    let unsubUsers = () => {};
    if (isAdmin) {
      const qUsers = collection(db, 'users');
      unsubUsers = onSnapshot(qUsers, (snapshot) => {
        const userList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserProfile[];
        setUsers(userList);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });
    }

    return () => {
      unsubEval();
      unsubUsers();
    };
  }, [isAdmin, user.id]);

  // When admin selects a user to evaluate
  const handleEmployeeSelection = (empId: string) => {
    setSelectedEmployeeId(empId);
    const targetUser = users.find(u => u.id === empId);
    if (targetUser) {
      setPosition(targetUser.role === 'admin' ? 'Administrator' : targetUser.role === 'coordinator' ? 'CI Coordinator' : 'CIBI Officer');
      if (targetUser.role === 'admin') {
        setClassification('Manager');
      } else if (targetUser.role === 'coordinator') {
        setClassification('Supervisor / Head');
      } else {
        setClassification('Office Staff');
      }
    }
    
    // Reset points
    const initial: Record<string, number> = {};
    CRITERIA.forEach(c => {
      initial[c.id.toString()] = 0;
    });
    setRatings(initial);
    setStrongPoints('');
    setWeakPoints('');
    setTrainingRecommendation('');
    setAbsences('None');
    setTardiness('None');
    setUndertime('None');
    setDisciplinaryActions('None');
    setTypeOfViolation('None');
  };

  // Check which criteria are active based on classification
  const isManagerCriteriaActive = useMemo(() => {
    return ['Manager', 'Leader', 'Supervisor / Head'].includes(classification);
  }, [classification]);

  // Filtered criteria to evaluate based on classification
  const activeCriteria = useMemo(() => {
    return CRITERIA.filter(c => !c.isManagerOnly || isManagerCriteriaActive);
  }, [isManagerCriteriaActive]);

  // Handle rating selection
  const handleRate = (criterionId: number, score: number) => {
    setRatings(prev => ({
      ...prev,
      [criterionId.toString()]: score
    }));
  };

  // Calculate total scores
  const scoreStats = useMemo(() => {
    let sum = 0;
    let count = 0;
    activeCriteria.forEach(c => {
      const val = ratings[c.id.toString()] || 0;
      if (val > 0) {
        sum += val;
        count++;
      }
    });

    const average = count > 0 ? Number((sum / count).toFixed(2)) : 0;
    
    let descriptive = "None";
    if (average >= 4.5) descriptive = "Excellent (5)";
    else if (average >= 3.5) descriptive = "Very Satisfactory (4)";
    else if (average >= 2.5) descriptive = "Satisfactory (3)";
    else if (average >= 1.5) descriptive = "Fair (2)";
    else if (average > 0) descriptive = "Poor (1)";

    return { sum, average, descriptive, count };
  }, [ratings, activeCriteria]);

  // Submit performance evaluation
  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all active criteria have been rated
    const unrated = activeCriteria.filter(c => !ratings[c.id.toString()] || ratings[c.id.toString()] === 0);
    if (unrated.length > 0) {
      toast.error(`Please provide a rating for: ${unrated.map(c => c.title).join(', ')}`);
      return;
    }

    let empName = '';
    if (currentTab === 'create_self') {
      empName = user.fullName;
    } else {
      const selectedEmp = users.find(u => u.id === selectedEmployeeId);
      empName = selectedEmp ? selectedEmp.fullName : 'Selected Employee';
    }

    if (!selectedEmployeeId) {
      toast.error("Please select an employee first.");
      return;
    }

    try {
      const evaluationPayload: Omit<EvaluationRecord, 'id'> = {
        employeeId: selectedEmployeeId,
        employeeName: empName,
        evaluatorId: user.id,
        evaluatorName: user.fullName,
        evaluatorRole: user.role,
        type: currentTab === 'create_self' ? 'self' : 'superior',
        dateHired,
        position,
        status,
        department,
        ratingPeriod,
        classification,
        otherClassification: classification === 'Others' ? otherClassification : '',
        ratings,
        strongPoints,
        weakPoints,
        trainingRecommendation,
        absences: isAdmin ? absences : 'To be filled by HR',
        tardiness: isAdmin ? tardiness : 'To be filled by HR',
        undertime: isAdmin ? undertime : 'To be filled by HR',
        disciplinaryActions: isAdmin ? disciplinaryActions : 'To be filled by HR',
        typeOfViolation: isAdmin ? typeOfViolation : 'To be filled by HR',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'evaluations'), evaluationPayload);
      toast.success("Performance Evaluation successfully submitted!");
      setCurrentTab('list');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'evaluations');
    }
  };

  // Delete evaluation
  const handleDeleteEval = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this evaluation permanently?")) return;
    try {
      await deleteDoc(doc(db, 'evaluations', id));
      toast.success("Evaluation record deleted!");
      if (selectedEval?.id === id) setSelectedEval(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `evaluations/${id}`);
    }
  };

  // Filter evaluations list
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(e => {
      const matchesSearch = e.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.evaluatorName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' ? true : e.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [evaluations, searchQuery, typeFilter]);

  // Process printing / Native browser print to PDF
  const handlePrint = () => {
    window.print();
  };

  // Open HR Edit Info Modal
  const openHrEdit = (evalRec: EvaluationRecord) => {
    setHrEditId(evalRec.id || null);
    setAbsences(evalRec.absences || 'None');
    setTardiness(evalRec.tardiness || 'None');
    setUndertime(evalRec.undertime || 'None');
    setDisciplinaryActions(evalRec.disciplinaryActions || 'None');
    setTypeOfViolation(evalRec.typeOfViolation || 'None');
    setIsEditingHR(true);
  };

  // Save HR Edits
  const saveHrEdit = async () => {
    if (!hrEditId) return;
    try {
      await updateDoc(doc(db, 'evaluations', hrEditId), {
        absences,
        tardiness,
        undertime,
        disciplinaryActions,
        typeOfViolation
      });
      toast.success("HR metrics successfully updated!");
      setIsEditingHR(false);
      setHrEditId(null);
      
      // Update selected view if needed
      if (selectedEval && selectedEval.id === hrEditId) {
        setSelectedEval(prev => prev ? {
          ...prev,
          absences,
          tardiness,
          undertime,
          disciplinaryActions,
          typeOfViolation
        } : null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `evaluations/${hrEditId}`);
    }
  };

  // Compute stats for printed record
  const getRecordScoreStats = (evalRec: EvaluationRecord) => {
    let sum = 0;
    let count = 0;
    const isMgr = ['Manager', 'Leader', 'Supervisor / Head'].includes(evalRec.classification);
    const active = CRITERIA.filter(c => !c.isManagerOnly || isMgr);
    
    active.forEach(c => {
      const val = evalRec.ratings[c.id.toString()] || 0;
      if (val > 0) {
        sum += val;
        count++;
      }
    });

    const average = count > 0 ? Number((sum / count).toFixed(2)) : 0;
    let descriptive = "None";
    if (average >= 4.5) descriptive = "Excellent (5)";
    else if (average >= 3.5) descriptive = "Very Satisfactory (4)";
    else if (average >= 2.5) descriptive = "Satisfactory (3)";
    else if (average >= 1.5) descriptive = "Fair (2)";
    else if (average > 0) descriptive = "Poor (1)";

    return { sum, average, descriptive, count };
  };

  return (
    <div className="space-y-6">
      {/* Printable Area - Hidden during standard web view */}
      {selectedEval && (
        <div className="hidden print:block font-sans text-black bg-white p-2 w-full max-w-[800px] mx-auto text-[8.5px] print-container" style={{ contentVisibility: 'auto' }}>
          {/* Custom print styling to override default margin and backgrounds */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background-color: #fff !important;
                color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                font-family: Arial, Helvetica, sans-serif !important;
              }
              @page {
                size: A4 portrait;
                margin: 6mm 10mm 6mm 10mm;
              }
              footer, #root > .print\\:hidden {
                display: none !important;
              }
              .print-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                background-color: transparent !important;
              }
              tr {
                page-break-inside: avoid !important;
              }
            }
          ` }} />

          {/* CIBI System Header Layout */}
          <table className="w-full border-collapse border border-black text-[8px] leading-tight mb-1">
            <tbody>
              <tr>
                {/* Left block for status tracking metadata */}
                <td className="border border-black p-1 w-[20%] font-mono text-[7px]" style={{ width: '20%' }}>
                  <div className="flex justify-between"><span>Initial Release</span><span className="font-semibold">: 12.05.2021</span></div>
                  <div className="flex justify-between"><span>Approved date</span><span className="font-semibold">: 12.05.2021</span></div>
                  <div className="flex justify-between"><span>Registration date</span><span className="font-semibold">: 12.05.2021</span></div>
                  <div className="flex justify-between"><span>Uploaded</span><span className="font-semibold">: </span></div>
                </td>
                
                {/* Centered Document Title & Organization Branding */}
                <td className="border border-black p-1.5 w-[65%] text-center align-middle" style={{ width: '65%' }}>
                  <div className="font-black text-[13px] uppercase tracking-[0.2em] text-emerald-900 leading-none">CIBI Management System</div>
                  <div className="font-bold text-[9.5px] uppercase tracking-wider text-slate-800 mt-1">Performance Evaluation Sheet</div>
                </td>
                
                {/* Form Code details */}
                <td className="border border-black p-1 w-[15%] text-[7px] text-center align-middle" style={{ width: '15%' }}>
                  <div className="font-semibold">Form Control No. / Rev.#</div>
                  <div className="font-extrabold text-[8px] mt-1">FO-HRM-10 rev.01</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Metadata Grid */}
          <table className="w-full border-collapse border border-black text-[8.5px] leading-tight mb-1">
            <tbody>
              <tr>
                <td className="border border-black p-1 px-2 font-bold bg-neutral-100 w-[12%]" style={{ width: '12%' }}>Name</td>
                <td className="border border-black p-1 px-2 uppercase font-semibold text-slate-800 w-[38%]" style={{ width: '38%' }}>{selectedEval.employeeName}</td>
                <td className="border border-black p-1 px-2 font-bold bg-neutral-100 w-[12%]" style={{ width: '12%' }}>Date Hired</td>
                <td className="border border-black p-1 px-2 font-semibold text-slate-800 w-[38%]" style={{ width: '38%' }}>{selectedEval.dateHired || 'N/A'}</td>
              </tr>
              <tr>
                <td className="border border-black p-1 px-2 font-bold bg-neutral-100">Position</td>
                <td className="border border-black p-1 px-2 uppercase font-semibold text-slate-800">{selectedEval.position}</td>
                <td className="border border-black p-1 px-2 font-bold bg-neutral-100">Status</td>
                <td className="border border-black p-1 px-2 font-semibold text-slate-800">{selectedEval.status || 'Regular'}</td>
              </tr>
              <tr>
                <td className="border border-black p-1 px-2 font-bold bg-neutral-100">Department</td>
                <td className="border border-black p-1 px-2 uppercase font-semibold text-slate-800">{selectedEval.department}</td>
                <td className="border border-black p-1 px-2 font-bold bg-neutral-100">Rating Period</td>
                <td className="border border-black p-1 px-2 font-semibold text-slate-800">{selectedEval.ratingPeriod}</td>
              </tr>
            </tbody>
          </table>

          {/* Classification Options Checkbox Row */}
          <table className="w-full border-collapse border border-black text-[8.5px] leading-tight mb-1">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold bg-neutral-100 w-[18%] text-center align-middle uppercase" style={{ width: '18%' }}>
                  Classification
                </td>
                <td className="border border-black p-1 px-3 align-middle" colSpan={3}>
                  <div className="grid grid-cols-12 gap-1 items-center">
                    {/* Columns representing Manager and Supervisor checkboxes */}
                    <div className="col-span-4 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black bg-white text-[9px] font-bold">
                          {selectedEval.classification === 'Manager' ? '✓' : ''}
                        </span>
                        <span className="font-semibold text-slate-800">Manager</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black bg-white text-[9px] font-bold">
                          {selectedEval.classification === 'Supervisor / Head' ? '✓' : ''}
                        </span>
                        <span className="font-semibold text-slate-800">Supervisor / Head</span>
                      </div>
                    </div>

                    {/* Columns representing Leader and Staff checkboxes */}
                    <div className="col-span-4 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black bg-white text-[9px] font-bold">
                          {selectedEval.classification === 'Leader' ? '✓' : ''}
                        </span>
                        <span className="font-semibold text-slate-800">Leader</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black bg-white text-[9px] font-bold">
                          {selectedEval.classification === 'Office Staff' ? '✓' : ''}
                        </span>
                        <span className="font-semibold text-slate-800">Office Staff</span>
                      </div>
                    </div>

                    {/* Specifying others */}
                    <div className="col-span-4 flex flex-col justify-start">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black bg-white text-[9px] font-bold">
                          {selectedEval.classification === 'Others' || selectedEval.classification === 'CIBI Officer' || ['Manager', 'Leader', 'Supervisor / Head', 'Office Staff'].indexOf(selectedEval.classification) === -1 ? '✓' : ''}
                        </span>
                        <span className="font-semibold text-slate-800">Others;Please specify:</span>
                      </div>
                      <div className="border-b border-black text-center text-[9px] uppercase font-bold text-slate-900 mt-0.5 min-h-[14px]">
                        {['Manager', 'Leader', 'Supervisor / Head', 'Office Staff'].includes(selectedEval.classification)
                          ? '' 
                          : selectedEval.classification || selectedEval.otherClassification}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Criteria & Ratings Section Table */}
          <table className="w-full border-collapse border border-black text-[8px] leading-tight mb-1">
            <thead>
              <tr className="bg-neutral-100 border-b border-black font-extrabold uppercase text-[8px]">
                <th className="border-r border-black p-1 text-center w-[88%]" style={{ width: '88%' }}>CRITERIA</th>
                <th className="p-1 text-center w-[12%]" style={{ width: '12%' }}>POINTS</th>
              </tr>
            </thead>
            <tbody>
              {/* Row: * For all employees header */}
              <tr className="bg-neutral-50 border-b border-black">
                <td className="p-1 px-2 font-bold text-[8.5px] italic text-neutral-800" colSpan={2}>
                  * For all employees
                </td>
              </tr>

              {/* Loop for items 1-10 */}
              {CRITERIA.slice(0, 10).map((crit) => {
                const score = selectedEval.ratings[crit.id.toString()];
                return (
                  <tr key={crit.id} className="border-b border-black">
                    <td className="border-r border-black p-1 px-2 text-left">
                      <div className="font-bold text-[8.5px] uppercase">{crit.id}. {crit.title}</div>
                      <div className="text-[7.5px] text-gray-700 mt-0.5 font-normal leading-tight italic">{crit.description}</div>
                    </td>
                    <td className="p-1 text-center font-extrabold text-[12px] align-middle">
                      {score || ''}
                    </td>
                  </tr>
                );
              })}

              {/* Row: * Additional for managers */}
              <tr className="bg-neutral-50 border-b border-black">
                <td className="p-1 px-2 font-bold text-[8.5px] italic text-neutral-800" colSpan={2}>
                  * Additional for managers, supervisors / heads and leaders only
                </td>
              </tr>

              {/* Loop for items 11-15 */}
              {CRITERIA.slice(10, 15).map((crit) => {
                const isEvalMgr = ['Manager', 'Leader', 'Supervisor / Head'].includes(selectedEval.classification);
                const score = isEvalMgr ? selectedEval.ratings[crit.id.toString()] : null;
                return (
                  <tr key={crit.id} className="border-b border-black">
                    <td className="border-r border-black p-1 px-2 text-left">
                      <div className="font-bold text-[8.5px] uppercase">{crit.id}. {crit.title}</div>
                      <div className="text-[7.5px] text-gray-700 mt-0.5 font-normal leading-tight italic">{crit.description}</div>
                    </td>
                    <td className="p-1 text-center font-extrabold text-[12px] align-middle">
                      {isEvalMgr && score ? score : ''}
                    </td>
                  </tr>
                );
              })}

              {/* Rating Legend Header / Details & Total Rating Column */}
              <tr className="border-b border-black">
                <td className="border-r border-black p-1 w-[88%]" style={{ width: '88%' }}>
                  <div className="grid grid-cols-12 gap-1 align-top">
                    <div className="col-span-12">
                      {/* Flex layout for rating points */}
                      <div className="flex justify-between font-extrabold text-[7.5px] border-b border-slate-200 pb-0.5 mb-0.5">
                        <span>5 = Excellent</span>
                        <span>4 = Very Satisfactory</span>
                        <span>3 = Satisfactory</span>
                        <span>2 = Fair</span>
                        <span>1 = Poor</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[6.5px] leading-snug italic font-medium">
                        <div><b>Excellent</b> — Consistently far exceeds expectations.</div>
                        <div><b>Very Satisfactory</b> — Consistently meets and frequently exceeds expectations.</div>
                        <div><b>Satisfactory</b> — Consistently meets and occasionally exceeds expectations.</div>
                        <div><b>Fair</b> — Occasionally fails to meet expectations.</div>
                        <div className="col-span-2"><b>Poor</b> — Frequently fails to meet expectations.</div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-1 text-center align-middle bg-neutral-100" style={{ width: '12%' }}>
                  <div className="font-bold text-[7.5px] uppercase leading-tight">TOTAL RATING</div>
                  <div className="text-[15px] font-black tracking-tight text-neutral-900 mt-1">
                    {getRecordScoreStats(selectedEval).average || '-'}
                  </div>
                  <div className="text-[6.5px] font-extrabold uppercase text-slate-500 mt-0.5 leading-none">
                    {getRecordScoreStats(selectedEval).descriptive.split(' (')[0]}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Rating Note Row */}
          <div className="border border-black p-1 bg-neutral-100 font-bold text-[7.5px] italic mb-1 text-center uppercase tracking-tight">
            Note: Rating from 3 and below - priority to attend training for improvement; rating 4 and above less priority to attend training
          </div>

          {/* Strong/Weak / Training Recommendation */}
          <table className="w-full border-collapse border border-black text-[8px] leading-tight mb-1">
            <tbody>
              <tr className="border-b border-black">
                <td className="border-r border-black p-1.5 px-2 font-bold bg-neutral-100 w-[18%] text-[7.5px] uppercase align-middle" style={{ width: '18%' }}>Strong Points</td>
                <td className="p-1.5 px-2 text-[8px] align-middle font-semibold text-slate-800">{selectedEval.strongPoints || 'None'}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-1.5 px-2 font-bold bg-neutral-100 text-[7.5px] uppercase align-middle">Weak Points</td>
                <td className="p-1.5 px-2 text-[8px] align-middle font-semibold text-slate-800">{selectedEval.weakPoints || 'None'}</td>
              </tr>
              <tr>
                <td className="border-r border-black p-1.5 px-2 font-bold bg-neutral-100 text-[7.5px] uppercase align-middle">Training Recommendation</td>
                <td className="p-1.5 px-2 text-[8px] align-middle font-semibold text-slate-800">{selectedEval.trainingRecommendation || 'None'}</td>
              </tr>
            </tbody>
          </table>

          {/* To be filled out by HR Column */}
          <table className="w-full border-collapse border border-black text-[7.5px] leading-tight mb-1">
            <tbody>
              {/* HR use only header */}
              <tr className="bg-neutral-100 border-b border-black font-extrabold text-center uppercase text-[8px]">
                <td colSpan={6} className="p-1 px-2">
                  To be filled out by HR
                </td>
              </tr>
              {/* Attendance subtitle */}
              <tr className="bg-neutral-50 border-b border-black text-center font-bold uppercase text-[7px]">
                <td colSpan={6} className="p-0.5">
                  Attendance Record
                </td>
              </tr>
              {/* Attendance metrics */}
              <tr className="border-b border-black">
                <td className="p-1 font-bold bg-white text-center w-[16%]" style={{ width: '16%' }}>No. of Absences</td>
                <td className="p-1 border-l border-r border-dashed border-slate-400 text-center text-slate-800 uppercase font-bold w-[17%]" style={{ width: '17%' }}>
                  {selectedEval.absences || 'None'}
                </td>
                <td className="p-1 font-bold bg-white text-center w-[16%]" style={{ width: '16%' }}>No. of Tardiness</td>
                <td className="p-1 border-l border-r border-dashed border-slate-400 text-center text-slate-800 uppercase font-bold w-[17%]" style={{ width: '17%' }}>
                  {selectedEval.tardiness || 'None'}
                </td>
                <td className="p-1 font-bold bg-white text-center w-[17%]" style={{ width: '17%' }}>No. of Undertime</td>
                <td className="p-1 text-center text-slate-800 uppercase font-bold w-[17%]" style={{ width: '17%' }}>
                  {selectedEval.undertime || 'None'}
                </td>
              </tr>
              {/* Disciplinary subtitle */}
              <tr className="bg-neutral-50 border-y border-black text-center font-bold uppercase text-[7px]">
                <td colSpan={6} className="p-0.5">
                  Disciplinary Action Record
                </td>
              </tr>
              {/* Disciplinary metrics */}
              <tr>
                <td colSpan={2} className="p-1 font-bold bg-white text-center w-[33%]" style={{ width: '33%' }}>No. of Disciplinary Action/s Received</td>
                <td colSpan={1} className="p-1 border-r border-dashed border-slate-400 text-center text-slate-800 uppercase font-bold w-[17%]" style={{ width: '17%' }}>
                  {selectedEval.disciplinaryActions || 'None'}
                </td>
                <td colSpan={2} className="p-1 font-bold bg-white text-center w-[33%]" style={{ width: '33%' }}>Type of Violation/s</td>
                <td colSpan={1} className="p-1 text-center text-slate-800 uppercase font-bold w-[17%]" style={{ width: '17%' }}>
                  {selectedEval.typeOfViolation || 'None'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Signatures Section at bottom */}
          <table className="w-full border-collapse border border-black text-[7px] text-center mt-3 mb-1">
            <thead>
              <tr className="bg-neutral-100 font-extrabold uppercase border-b border-black text-[7.5px]">
                <th className="border-r border-black p-1.5 w-[20%]" style={{ width: '20%' }}>Evaluated By/Date</th>
                <th className="border-r border-black p-1.5 w-[16%]" style={{ width: '16%' }}>Prepared By</th>
                <th className="border-r border-black p-1.5 w-[16%]" style={{ width: '16%' }}>Reviewed By</th>
                <th className="border-r border-black p-1.5 w-[16%]" style={{ width: '16%' }}>Approved By</th>
                <th className="border-r border-black p-1.5 w-[16%]" style={{ width: '16%' }}>Checked By</th>
                <th className="p-1.5 w-[16%]" style={{ width: '16%' }}>Conforme</th>
              </tr>
            </thead>
            <tbody>
              {/* Signature lines row */}
              <tr className="border-b border-black h-9">
                <td className="border-r border-black p-1 valign-bottom align-bottom">
                  <div className="font-bold text-[8px] uppercase">{selectedEval.evaluatorName}</div>
                  <div className="text-[6px] text-slate-400 tracking-tighter mt-0.5">SUBMISSION VERIFIED</div>
                </td>
                <td className="border-r border-black p-1 valign-bottom align-bottom">
                  <div className="font-bold text-[8px]">Harvey John T. Parjan</div>
                  <div className="text-[6px] text-slate-400 font-mono">HR Specialist</div>
                </td>
                <td className="border-r border-black p-1 valign-bottom align-bottom">
                  <div className="font-bold text-[8px]">Erly Rose M. Tabanera</div>
                  <div className="text-[6px] text-slate-400 font-mono">HR Supervisor</div>
                </td>
                <td className="border-r border-black p-1 valign-bottom align-bottom">
                  <div className="font-bold text-[8px]">Raymond A. Talavera</div>
                  <div className="text-[6px] text-slate-400 font-mono">VP Operations</div>
                </td>
                <td className="border-r border-black p-1 valign-bottom align-bottom">
                  <div className="font-bold text-[8px]">Atty. Gerry E. Valdez</div>
                  <div className="text-[6px] text-slate-400 font-mono">Legal & Chairman</div>
                </td>
                <td className="p-1 valign-bottom align-bottom">
                  <div className="font-bold text-[8px] uppercase">{selectedEval.employeeName}</div>
                  <div className="text-[6px] text-slate-400 tracking-tighter mt-0.5 font-mono">DIGITAL CONFORME</div>
                </td>
              </tr>
              {/* Bottom labels row */}
              <tr className="uppercase bg-neutral-50 font-extrabold text-[6.5px] leading-tight">
                <td className="border-r border-slate-900 p-1">Employee's Superior</td>
                <td className="border-r border-slate-900 p-1">Human Resources Assistant</td>
                <td className="border-r border-slate-900 p-1">Human Resources Head</td>
                <td className="border-r border-slate-900 p-1">Vice-President</td>
                <td className="border-r border-slate-900 p-1">Chairman & President</td>
                <td className="p-1">Employee</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Screen Interface - Hidden during browser printable view */}
      <div className="print:hidden">
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Award className="text-emerald-600" size={28} />
              Performance Evaluation
            </h1>
            <p className="text-xs text-gray-500 font-bold uppercase mt-1">
              CIBI Management System Performance Assessment Tool
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                setCurrentTab('list');
                setSelectedEval(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
                currentTab === 'list' && !selectedEval
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              Surveys & History
            </button>
            <button
              onClick={() => {
                setCurrentTab('create_self');
                setSelectedEval(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
                currentTab === 'create_self'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              New Self Evaluation
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  setCurrentTab('create_superior');
                  setSelectedEval(null);
                  setSelectedEmployeeId('');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1.5 ${
                  currentTab === 'create_superior'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <Plus size={14} /> Evaluate Employee
              </button>
            )}
          </div>
        </div>

        {/* Selected Evaluation Full Sheet Detail View */}
        {selectedEval ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 md:p-10 space-y-8 animate-fade-in">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
              <button 
                onClick={() => setSelectedEval(null)}
                className="flex items-center gap-1.5 text-xs font-black uppercase text-gray-500 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-gray-100 transition-all cursor-pointer"
              >
                <ChevronRight className="rotate-180" size={14} /> Back to List
              </button>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {isAdmin && (
                  <button
                    onClick={() => openHrEdit(selectedEval)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs font-black uppercase text-amber-800 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl border border-amber-100/50 transition-all cursor-pointer"
                  >
                    <Edit3 size={14} /> Update HR Metrics
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs font-black uppercase text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  <Printer size={14} /> Print / Export PDF
                </button>
              </div>
            </div>

            {/* CIBI System Form Layout */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden p-6 md:p-8 bg-gray-50/20 max-w-4xl mx-auto space-y-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2.5 select-none">
                  <div className="bg-emerald-850 text-white font-black text-xs px-2.5 py-1.5 rounded-lg tracking-widest shadow-xs">
                    CIBI
                  </div>
                  <div className="text-left font-black leading-none text-emerald-900 tracking-tighter">
                    <span className="text-sm block">CIBI System</span>
                    <span className="text-[7px] text-gray-500 uppercase block font-black">Management Platform</span>
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Performance Evaluation Sheet</h2>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider block mt-1 w-fit mx-auto">
                    {selectedEval.type === 'self' ? 'Self-Evaluation' : 'Superior Evaluation'}
                  </span>
                </div>

                <div className="text-right text-[9px] text-gray-400 uppercase font-bold">
                  <div>Form Control: FO-HRM-10 rev.01</div>
                  <div>Released: 12.05.2021</div>
                </div>
              </div>

              {/* Form Metadata Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Name</span>
                    <span className="font-black text-slate-800 uppercase">{selectedEval.employeeName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Position</span>
                    <span className="font-black text-slate-800 uppercase">{selectedEval.position}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Department</span>
                    <span className="font-black text-slate-800 uppercase">{selectedEval.department}</span>
                  </div>
                </div>

                <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Date Hired</span>
                    <span className="font-semibold text-slate-700">{selectedEval.dateHired || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Status</span>
                    <span className="font-semibold text-slate-700">{selectedEval.status || 'Regular'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Rating Period</span>
                    <span className="font-semibold text-slate-700">{selectedEval.ratingPeriod}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs flex flex-wrap gap-4 items-center justify-between uppercase">
                <span className="font-bold text-gray-400 tracking-wider text-[10px]">Employee Classification:</span>
                <span className="font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                  {selectedEval.classification}
                </span>
              </div>

              {/* Scores List Container */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-xs font-black uppercase text-gray-500">
                  <span>Rating Criteria & Scores</span>
                  <span className="text-emerald-700">Evaluated Points</span>
                </div>
                
                <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                  {CRITERIA.map((crit) => {
                    const isMgr = ['Manager', 'Leader', 'Supervisor / Head'].includes(selectedEval.classification);
                    if (crit.isManagerOnly && !isMgr) return null;
                    
                    const score = selectedEval.ratings[crit.id.toString()] || 0;
                    
                    return (
                      <div key={crit.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-800">
                            {crit.id}. {crit.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 italic font-medium">{crit.description}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-sm border border-emerald-100 shadow-sm">
                          {score}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Score Calc Banner */}
                <div className="bg-emerald-50 border-t border-emerald-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-black uppercase">
                  <div className="text-center md:text-left">
                    <span className="text-[10px] text-emerald-800 font-bold block mb-1">SCORE METRIC</span>
                    <span className="text-lg text-emerald-950 font-black tracking-tight uppercase">
                      {getRecordScoreStats(selectedEval).descriptive}
                    </span>
                  </div>

                  <div className="bg-white border border-emerald-100 rounded-xl px-5 py-3 text-center shadow-sm flex items-center gap-3">
                    <div>
                      <span className="text-[8px] text-gray-400 block font-bold leading-none mb-1">AVERAGE</span>
                      <span className="text-xl font-black text-emerald-700 font-mono">
                        {getRecordScoreStats(selectedEval).average}
                      </span>
                    </div>
                    <div className="h-6 w-[1px] bg-gray-200" />
                    <div>
                      <span className="text-[8px] text-gray-400 block font-bold leading-none mb-1">RATED ITEMS</span>
                      <span className="text-lg font-black text-slate-700 font-mono">
                        {getRecordScoreStats(selectedEval).count} / 15
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Qualitatives Box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-1 shadow-sm">
                  <h4 className="font-extrabold text-slate-700 tracking-tight text-[11px] uppercase border-b border-gray-100 pb-1.5 mb-2">
                    Strong Points
                  </h4>
                  <p className="text-gray-600 font-medium leading-relaxed italic">{selectedEval.strongPoints || 'None specified.'}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-1 shadow-sm">
                  <h4 className="font-extrabold text-slate-700 tracking-tight text-[11px] uppercase border-b border-gray-100 pb-1.5 mb-2">
                    Weak Points
                  </h4>
                  <p className="text-gray-600 font-medium leading-relaxed italic">{selectedEval.weakPoints || 'None specified.'}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-1 shadow-sm">
                  <h4 className="font-extrabold text-slate-700 tracking-tight text-[11px] uppercase border-b border-gray-100 pb-1.5 mb-2">
                    Training Recommendation
                  </h4>
                  <p className="text-gray-600 font-medium leading-relaxed italic">{selectedEval.trainingRecommendation || 'None specified.'}</p>
                </div>
              </div>

              {/* HR filled metrics section */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">
                    Staff HR Metrics Verification
                  </h4>
                  <span className="text-[8px] bg-white/10 text-white/80 font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                    HR Use Only
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] text-white/50 block font-bold uppercase tracking-wider mb-1">Absences Record</span>
                    <span className="font-extrabold uppercase text-emerald-300">{selectedEval.absences || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/50 block font-bold uppercase tracking-wider mb-1">Tardiness Record</span>
                    <span className="font-extrabold uppercase text-emerald-300">{selectedEval.tardiness || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/50 block font-bold uppercase tracking-wider mb-1">Undertime Record</span>
                    <span className="font-extrabold uppercase text-emerald-300">{selectedEval.undertime || 'None'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[9px] text-white/50 block font-bold uppercase tracking-wider mb-1">Disciplinary Actions received</span>
                    <span className="font-extrabold uppercase text-red-300">{selectedEval.disciplinaryActions || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/50 block font-bold uppercase tracking-wider mb-1">Type of Violation/s</span>
                    <span className="font-extrabold uppercase text-red-300">{selectedEval.typeOfViolation || 'None'}</span>
                  </div>
                </div>
              </div>

              {/* Evaluation verification audit trails */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-100 rounded-xl text-[10px] text-gray-500 font-bold uppercase">
                <div>Evaluated By: <span className="text-slate-800 font-black">{selectedEval.evaluatorName}</span> ({selectedEval.evaluatorRole})</div>
                <div className="md:text-right">Submitted: <span className="text-slate-800 font-black">{format(new Date(selectedEval.createdAt), 'MMM d, yyyy h:mm a')}</span></div>
              </div>
            </div>
          </div>
        ) : currentTab === 'list' ? (
          /* LIST OF SUBMISSIONS PANEL */
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search evaluations by employee, position, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black shadow-inner uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | 'self' | 'superior')}
                  className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black shadow-inner uppercase tracking-wider"
                >
                  <option value="all">All Types</option>
                  <option value="self">Self Evaluation</option>
                  <option value="superior">Superior Evaluation</option>
                </select>
              </div>
            </div>

            {/* List Table */}
            {loading ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-4">Loading evaluations record...</p>
              </div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <ClipboardCheck className="mx-auto mb-2 text-gray-300" size={48} />
                <p className="text-xs uppercase font-black tracking-widest text-gradient">No Evaluations Yet</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Submit your first self-evaluation using the button above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvaluations.map((evalRec) => {
                  const scoreInfo = getRecordScoreStats(evalRec);
                  return (
                    <div 
                      key={evalRec.id}
                      className="bg-white rounded-3xl border border-gray-100 hover:border-emerald-500/30 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all p-6 flex flex-col justify-between gap-5 relative overflow-hidden group"
                    >
                      {/* Top banner accent for self vs superior */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                        evalRec.type === 'self' ? 'bg-amber-500' : 'bg-emerald-600'
                      }`} />

                      {/* Info block */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-[8px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase ${
                            evalRec.type === 'self' 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {evalRec.type === 'self' ? 'Self Evaluation' : 'Superior Eval'}
                          </span>

                          <span className="text-[9px] font-bold text-gray-400">
                            {format(new Date(evalRec.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-extrabold text-slate-800 uppercase text-sm group-hover:text-emerald-700 transition-colors">
                            {evalRec.employeeName}
                          </h3>
                          <p className="text-[10px] text-gray-400 uppercase font-black mt-0.5">
                            {evalRec.position} • {evalRec.department}
                          </p>
                        </div>

                        {/* Calculations stats preview */}
                        <div className="bg-gray-50 rounded-2xl p-3 flex justify-between items-center">
                          <div>
                            <span className="text-[7px] text-gray-400 font-bold uppercase block leading-none">Overall Score</span>
                            <span className="text-base font-black text-emerald-700 font-mono">
                              {scoreInfo.average}
                            </span>
                          </div>
                          <div>
                            <span className="text-[7px] text-gray-400 font-bold uppercase block leading-none text-right">Rating</span>
                            <span className="text-[9px] font-black text-slate-700 uppercase block">
                              {scoreInfo.descriptive.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action trigger row */}
                      <div className="flex items-center gap-2 border-t border-gray-50 pt-4 mt-auto">
                        <button
                          onClick={() => setSelectedEval(evalRec)}
                          className="flex-1 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 uppercase font-bold text-[10px] tracking-widest rounded-xl transition-colors cursor-pointer border border-transparent hover:border-emerald-100"
                        >
                          View Sheet
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => openHrEdit(evalRec)}
                            title="Update HR Metrics"
                            className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-colors cursor-pointer border border-amber-100"
                          >
                            <Edit3 size={12} />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteEval(evalRec.id || '')}
                            title="Delete Permanently"
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors cursor-pointer border border-red-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* FORM ENTRY SHEET (FOR CREATE SELF EVAL & SUPERIOR EVAL) */
          <form onSubmit={handleSubmitEvaluation} className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-fade-in text-xs">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight border-b border-gray-100 pb-4">
              {currentTab === 'create_self' ? 'Submit Performance Self Evaluation' : 'Evaluate Employee (Employee\'s Superior)'}
            </h2>

            {/* Step 1: Metadata Fields */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100 space-y-4">
              <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider">
                1. General Employee Profile
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentTab === 'create_self' ? (
                  <div>
                    <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Employee Name</label>
                    <input 
                      type="text" 
                      value={user.fullName}
                      disabled
                      className="w-full bg-white border border-gray-150 rounded-xl p-3 font-semibold text-slate-700 uppercase"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Select Employee to Evaluate</label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => handleEmployeeSelection(e.target.value)}
                      required
                      className="w-full bg-white border border-gray-150 rounded-xl p-3 font-extrabold uppercase shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                    >
                      <option value="">-- Choose Employee --</option>
                      {users.filter(u => u.id !== user.id).map(u => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Date Hired</label>
                  <input 
                    type="date" 
                    value={dateHired}
                    onChange={(e) => setDateHired(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-150 rounded-xl p-3 font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Position Title</label>
                  <input 
                    type="text" 
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                    placeholder="e.g. CIBI Manager"
                    className="w-full bg-white border border-gray-150 rounded-xl p-3 font-semibold uppercase focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-white border border-gray-150 rounded-xl p-3 font-semibold focus:outline-none"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Probationary">Probationary</option>
                    <option value="Contractual">Contractual</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Department</label>
                  <input 
                    type="text" 
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    placeholder="e.g. CI & Customer Service"
                    className="w-full bg-white border border-gray-150 rounded-xl p-3 font-semibold uppercase focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Rating Period</label>
                  <input 
                    type="text" 
                    value={ratingPeriod}
                    onChange={(e) => setRatingPeriod(e.target.value)}
                    required
                    placeholder="e.g. Jan 01, 2025 to Mar 31, 2025"
                    className="w-full bg-white border border-gray-150 rounded-xl p-3 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Classification list checkboxes */}
              <div className="pt-2 border-t border-gray-200">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block mb-2">Classification</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Manager', 'Leader', 'Supervisor / Head', 'Office Staff', 'Others'].map((clsItem) => (
                    <label 
                      key={clsItem}
                      onClick={() => setClassification(clsItem)}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer transition-all uppercase font-bold text-[10px] ${
                        classification === clsItem
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="classification" 
                        value={clsItem}
                        checked={classification === clsItem}
                        readOnly
                        className="sr-only"
                      />
                      <span>{clsItem}</span>
                    </label>
                  ))}
                </div>

                {classification === 'Others' && (
                  <div className="mt-3">
                    <input 
                      type="text"
                      placeholder="Please specify other classification..."
                      value={otherClassification}
                      onChange={(e) => setOtherClassification(e.target.value)}
                      required
                      className="w-full max-w-md bg-white border border-gray-150 rounded-xl p-3 font-semibold uppercase focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Form rating entry table */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-gray-100 pb-2">
                <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider">
                  2. Criteria Assessment Rating
                </h3>

                <div className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                  Rating Selection: Rate from 1 (Poor) to 5 (Excellent)
                </div>
              </div>

              <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100 bg-white">
                {activeCriteria.map((c) => {
                  const val = ratings[c.id.toString()] || 0;
                  
                  return (
                    <div key={c.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="space-y-1.5 md:max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold text-slate-800 uppercase">
                            {c.id}. {c.title}
                          </span>
                          {c.isManagerOnly && (
                            <span className="text-[7px] bg-emerald-105 bg-emerald-100 text-emerald-800 uppercase font-bold tracking-widest px-1.5 py-0.5 rounded">
                              Mgr / Superior
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 italic font-medium leading-relaxed">{c.description}</p>
                      </div>

                      {/* Ratings radio 1 to 5 */}
                      <div className="flex items-center gap-2.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => handleRate(c.id, s)}
                            className={`w-9 h-9 rounded-xl flex flex-col justify-center items-center cursor-pointer transition-all font-mono border font-extrabold ${
                              val === s
                                ? 'bg-emerald-600 border-emerald-600 text-white scale-110 shadow-lg shadow-emerald-600/30'
                                : 'bg-white hover:bg-gray-100 text-slate-600 border-gray-200'
                            }`}
                          >
                            <span className="text-sm leading-none">{s}</span>
                            <span className="text-[6px] tracking-tight text-white/70 block mt-0.5">
                              {s === 5 ? 'EXC' : s === 1 ? 'POO' : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Score Calculator Preview */}
              <div className="bg-emerald-950 text-white rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="text-center md:text-left space-y-1">
                  <span className="text-[8px] font-black tracking-widest text-emerald-400 block uppercase">
                    EVALUATION RATING COEFFICIENT
                  </span>
                  <div className="text-2xl font-black uppercase tracking-tight">
                    {scoreStats.descriptive}
                  </div>
                  <p className="text-[10px] text-emerald-300 font-bold uppercase">
                    Note: Rating 3 below triggers mandatory HR coaching referral
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 text-center flex items-center gap-4">
                  <div>
                    <span className="text-[7px] text-emerald-300 block font-bold leading-none mb-1">AVERAGE</span>
                    <span className="text-2xl font-black text-white font-mono">
                      {scoreStats.average}
                    </span>
                  </div>
                  <div className="h-8 w-[1px] bg-white/10" />
                  <div>
                    <span className="text-[7px] text-emerald-300 block font-bold leading-none mb-1">ITEMS</span>
                    <span className="text-xl font-black text-white/80 font-mono">
                      {scoreStats.count} / {activeCriteria.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Strong Points / Weak Points */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider">
                3. Strong Points, Weak Points & Recommendations
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block">Strong Points (Mga Malakas na Katangian)</label>
                  <textarea 
                    rows={4}
                    value={strongPoints}
                    onChange={(e) => setStrongPoints(e.target.value)}
                    required
                    placeholder="Provide specific details about employee strong traits..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block">Weak Points (Mga Kahinaan)</label>
                  <textarea 
                    rows={4}
                    value={weakPoints}
                    onChange={(e) => setWeakPoints(e.target.value)}
                    required
                    placeholder="Provide details of performance points requiring improvement..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider block">Training Recommendations</label>
                  <textarea 
                    rows={4}
                    value={trainingRecommendation}
                    onChange={(e) => setTrainingRecommendation(e.target.value)}
                    required
                    placeholder="Any specific training suggested for development..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: HR-specific fields (Only if filled by Admin) */}
            {isAdmin && (
              <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4 shadow-md">
                <h3 className="text-xs font-black uppercase text-emerald-400 tracking-widest border-b border-white/10 pb-2">
                  4. HR Direct Record Filling (Admin / HR Use Only)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-[9px] text-white/50 uppercase tracking-wider block mb-1">No. of Absences</label>
                    <input 
                      type="text" 
                      value={absences}
                      onChange={(e) => setAbsences(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 rounded-xl p-3 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[9px] text-white/50 uppercase tracking-wider block mb-1">No. of Tardiness</label>
                    <input 
                      type="text" 
                      value={tardiness}
                      onChange={(e) => setTardiness(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 rounded-xl p-3 font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[9px] text-white/50 uppercase tracking-wider block mb-1">No. of Undertime</label>
                    <input 
                      type="text" 
                      value={undertime}
                      onChange={(e) => setUndertime(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 rounded-xl p-3 font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/10">
                  <div>
                    <label className="font-bold text-[9px] text-white/50 uppercase tracking-wider block mb-1">Disciplinary Actions Received</label>
                    <input 
                      type="text" 
                      value={disciplinaryActions}
                      onChange={(e) => setDisciplinaryActions(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 rounded-xl p-3 font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[9px] text-white/50 uppercase tracking-wider block mb-1">Type of Violation/s</label>
                    <input 
                      type="text" 
                      value={typeOfViolation}
                      onChange={(e) => setTypeOfViolation(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 rounded-xl p-3 font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Control buttons */}
            <div className="flex border-t border-gray-100 pt-6 gap-3">
              <button
                type="button"
                onClick={() => setCurrentTab('list')}
                className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Submit Performance Sheet
              </button>
            </div>
          </form>
        )}
      </div>

      {/* HR Info Edit Popup Modal */}
      {isEditingHR && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 shadow-2xl animate-scale-up text-xs font-sans text-gray-800">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-black uppercase tracking-wider text-[11px] text-emerald-400">
                Update Staff HR Attendance & Records
              </h3>
              <button 
                onClick={() => setIsEditingHR(false)}
                className="text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase block mb-1">Absences</label>
                  <input 
                    type="text"
                    value={absences}
                    onChange={(e) => setAbsences(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase block mb-1">Tardiness</label>
                  <input 
                    type="text"
                    value={tardiness}
                    onChange={(e) => setTardiness(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase block mb-1">Undertime</label>
                  <input 
                    type="text"
                    value={undertime}
                    onChange={(e) => setUndertime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase block mb-1">Disciplinary Received</label>
                  <input 
                    type="text"
                    value={disciplinaryActions}
                    onChange={(e) => setDisciplinaryActions(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase block mb-1">Violations / Remarks</label>
                  <input 
                    type="text"
                    value={typeOfViolation}
                    onChange={(e) => setTypeOfViolation(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditingHR(false)}
                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-600 font-extrabold uppercase rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveHrEdit}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase rounded-xl shadow-md cursor-pointer transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
