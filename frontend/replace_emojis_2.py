import os
import re

files = {
    "src/pages/UserDashboard.jsx": [
        (r"<span className=\"text-base leading-none\">📱</span>", "<Smartphone className=\"w-4 h-4 mr-2\" />"),
        (r"<div className=\"opacity-50 text-\[14px\]\">📋</div>", "<ClipboardList className=\"opacity-50 w-4 h-4\" />"),
        (r"<div className=\"opacity-50 text-\[14px\]\">✅</div>", "<CheckCircle className=\"opacity-50 w-4 h-4\" />"),
        (r"<div className=\"opacity-50 text-\[14px\]\">⏳</div>", "<Clock className=\"opacity-50 w-4 h-4\" />"),
        (r"📭", "<Inbox className=\"w-8 h-8 mb-[12px] opacity-60\" />")
    ],
    "src/pages/TrackComplaint.jsx": [
        (r"🔍", "<Search size={28} />"),
        (r"🛣️", "<Map size={16} className=\"inline mr-1\"/>"),
        (r"🗑️", "<Trash2 size={16} className=\"inline mr-1\"/>"),
        (r"💧", "<Droplets size={16} className=\"inline mr-1\"/>"),
        (r"⚡", "<Zap size={16} className=\"inline mr-1\"/>"),
        (r"📋", "<ClipboardList size={16} className=\"inline mr-1\"/>"),
        (r"📱 WhatsApp", "<Smartphone size={16} className=\"inline mr-1\"/> WhatsApp"),
        (r"🌐 Web Portal", "<Globe size={16} className=\"inline mr-1\"/> Web Portal"),
        (r"<span className=\"text-\[16px\] leading-none\">📱</span>", "<Smartphone className=\"w-4 h-4\" />")
    ],
    "src/components/ComplaintCard.jsx": [
        (r"🛣️", "<Map size={14} className=\"inline mr-1\"/>"),
        (r"🗑️", "<Trash2 size={14} className=\"inline mr-1\"/>"),
        (r"💧", "<Droplets size={14} className=\"inline mr-1\"/>"),
        (r"⚡", "<Zap size={14} className=\"inline mr-1\"/>"),
        (r"📋", "<ClipboardList size={14} className=\"inline mr-1\"/>"),
        (r"📍", "<MapPin size={12} className=\"inline mr-1\"/>"),
        (r"⏳", "<Clock size={12} className=\"inline mr-1\"/>"),
        (r"✅", "<CheckCircle size={12} className=\"inline mr-1\"/>")
    ],
    "src/pages/SuperAdminDashboard.jsx": [
        (r"'🥇', '🥈', '🥉'", "<Award className=\"w-4 h-4 text-amber\" />, <Award className=\"w-4 h-4 text-gray-400\" />, <Award className=\"w-4 h-4 text-amber-700\" />"),
        (r"'✅'", "<CheckCircle size={16} className=\"inline\" />"),
        (r"'❌'", "<XCircle size={16} className=\"inline\" />"),
        (r"🌏", "<Globe size={18} className=\"inline mr-2\" />"),
        (r"'📋'", "<ClipboardList size={16} className=\"inline\" />"),
        (r"'🚨'", "<AlertTriangle size={16} className=\"inline text-burg\" />"),
        (r"'🛣️'", "<Map size={16} className=\"inline\"/>"),
        (r"'🗑️'", "<Trash2 size={16} className=\"inline\"/>"),
        (r"'💧'", "<Droplets size={16} className=\"inline\"/>"),
        (r"'⚡'", "<Zap size={16} className=\"inline\"/>"),
        (r"<span className=\"text-\[20px\] leading-none\">📊</span>", "<BarChart className=\"w-5 h-5\" />"),
        (r"📍", "<MapPin size={12} className=\"inline mr-1\"/>")
    ]
}

imports = {
    "src/pages/UserDashboard.jsx": "import { Smartphone, ClipboardList, CheckCircle, Clock, Inbox } from 'lucide-react';\n",
    "src/pages/TrackComplaint.jsx": "import { Search, Map, Trash2, Droplets, Zap, ClipboardList, Smartphone, Globe } from 'lucide-react';\n",
    "src/components/ComplaintCard.jsx": "import { Map, Trash2, Droplets, Zap, ClipboardList, MapPin, Clock, CheckCircle } from 'lucide-react';\n",
    "src/pages/SuperAdminDashboard.jsx": "import { Award, CheckCircle, XCircle, Globe, ClipboardList, AlertTriangle, Map, Trash2, Droplets, Zap, BarChart, MapPin } from 'lucide-react';\n"
}

for file_path, replacements in files.items():
    full_path = os.path.join("/Users/mann/HackOverflow/frontend", file_path)
    if not os.path.exists(full_path):
        continue
    with open(full_path, "r") as f:
        content = f.read()
    
    for old, new in replacements:
        content = re.sub(old, new, content)
        
    if imports[file_path] and "lucide-react" not in content:
        lines = content.split('\n')
        last_import = 0
        for i, line in enumerate(lines):
            if line.startswith("import "):
                last_import = i
        lines.insert(last_import + 1, imports[file_path].strip())
        content = '\n'.join(lines)
        
    with open(full_path, "w") as f:
        f.write(content)

print("Done 2")
