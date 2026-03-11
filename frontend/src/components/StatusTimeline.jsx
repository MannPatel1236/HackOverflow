const STEPS = [
  { key: 'Registered', label: 'Registered', icon: '🔵' },
  { key: 'Under Review', label: 'Under Review', icon: '🟡' },
  { key: 'In Progress', label: 'In Progress', icon: '🔧' },
  { key: 'Resolved', label: 'Resolved', icon: '✅' },
];

export default function StatusTimeline({ status, statusHistory = [] }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* Progress bar */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-800 mx-10">
          <div
            className="h-full bg-indigo-600 transition-all duration-700"
            style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {STEPS.map((step, idx) => {
            const isDone = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-500 ${
                    isDone
                      ? 'border-indigo-500 bg-indigo-600/20'
                      : 'border-slate-700 bg-slate-900'
                  } ${isCurrent ? 'ring-4 ring-indigo-500/30' : ''}`}
                >
                  {step.icon}
                </div>
                <div className="text-center">
                  <p
                    className={`text-xs font-medium ${
                      isDone ? 'text-indigo-400' : 'text-slate-600'
                    }`}
                  >
                    {step.label}
                  </p>
                  {statusHistory.find((h) => h.status === step.key) && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      {new Date(
                        statusHistory.find((h) => h.status === step.key).timestamp
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
