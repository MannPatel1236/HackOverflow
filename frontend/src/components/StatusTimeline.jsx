import { motion } from 'framer-motion';
import { 
  FileCheck, 
  Search, 
  Activity, 
  CheckCircle2,
  Clock,
  ShieldCheck
} from 'lucide-react';

const STEPS = [
  { key: 'registered', label: 'Registered', icon: FileCheck },
  { key: 'under_review', label: 'Under Review', icon: Search },
  { key: 'in_progress', label: 'In Progress', icon: Activity },
  { key: 'resolved', label: 'Resolved', icon: ShieldCheck },
];

export default function StatusTimeline({ status, statusHistory = [] }) {
  // Normalize status key
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_') || 'registered';
  const currentIndex = STEPS.findIndex((s) => s.key === normalizedStatus);

  return (
    <div className="relative pt-8 pb-12">
      {/* Background Track */}
      <div className="absolute top-[60px] left-0 w-full h-1 bg-off rounded-full" />
      
      {/* Active Track */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        transition={{ duration: 1, ease: "circOut" }}
        className="absolute top-[60px] left-0 h-1 bg-burg rounded-full z-10"
      />

      {/* Steps */}
      <div className="relative z-20 flex justify-between">
        {STEPS.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const historyEntry = statusHistory.find(h => h.status.toLowerCase().replace(/\s+/g, '_') === step.key);
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center group">
              <motion.div 
                initial={false}
                animate={{ 
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isDone ? '#8B1A1A' : '#F9F8F3',
                  borderColor: isDone ? '#8B1A1A' : '#EAE9E2',
                  color: isDone ? '#FFFFFF' : '#333333'
                }}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-sm ${isCurrent ? 'shadow-lg shadow-burg/20 ring-4 ring-burg/5' : ''}`}
              >
                <Icon size={24} strokeWidth={isCurrent ? 2.5 : 2} />
              </motion.div>
              
              <div className="text-center mt-6">
                <p className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${isDone ? 'text-navy' : 'text-dim'}`}>
                  {step.label}
                </p>
                {historyEntry && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[9px] font-bold text-muted uppercase tracking-tighter mt-1"
                  >
                    {new Date(historyEntry.timestamp).toLocaleDateString()}
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
