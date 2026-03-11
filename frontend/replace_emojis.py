import os
import re

files = {
    "src/pages/LandingPage.jsx": [
        (r"'🎤'", "<Mic size={20} />"),
        (r"'🤖'", "<Bot size={20} />"),
        (r"'📍'", "<MapPin size={20} />"),
        (r"'🔔'", "<Bell size={20} />"),
        (r"'📊'", "<BarChart size={20} />"),
        (r"'🏆'", "<Trophy size={20} />"),
        (r"File Complaint 📝", "File Complaint <FileText className=\"inline ml-2\" size={16} />"),
        (r"<span className=\"text-lg\">📱</span>", "<Smartphone className=\"w-5 h-5 mr-2\" />")
    ],
    "src/pages/LoginPage.jsx": [
        (r"🇮🇳 \+91", "IN +91"),
        (r"<span className=\"text-lg leading-none\">📱</span>", "<Smartphone className=\"w-5 h-5\" />")
    ],
    "src/pages/AdminLoginPage.jsx": [
        (r"'🔐 Sign in as Officer'", "'Sign in as Officer'") 
    ],
    "src/pages/FileComplaint.jsx": [
        (r"✅", "<CheckCircle className=\"w-10 h-10 text-green\" />"),
        (r"'🎤 Voice Recording'", "<span className=\"flex items-center gap-2\"><Mic size={16}/> Voice Recording</span>"),
        (r"⚡", "<Zap size={20} className=\"inline\" />"),
        (r"\{recording \? '⏹' : '🎤'\}", "{recording ? <Square size={20} /> : <Mic size={20} />}"),
        (r"📍 Incident Location", "<MapPin size={18} className=\"inline mr-2\" /> Incident Location"),
        (r"'🚀 Submit Grievance Securely'", "<span className=\"flex items-center gap-2\"><Rocket size={18}/> Submit Grievance Securely</span>"),
        (r"🤖", "<Bot size={20} className=\"inline\" />")
    ],
    "src/pages/StateAdminDashboard.jsx": [
        (r"<div className=\"opacity-50 text-\[14px\]\">📋</div>", "<ClipboardList className=\"opacity-50 w-4 h-4\" />"),
        (r"<div className=\"opacity-50 text-\[14px\]\">✅</div>", "<CheckCircle className=\"opacity-50 w-4 h-4\" />"),
        (r"<div className=\"opacity-50 text-\[14px\]\">⏳</div>", "<Clock className=\"opacity-50 w-4 h-4\" />"),
        (r"📍 <span className=\"uppercase tracking-wide\">", "<MapPin size={16} className=\"inline mr-1\" /> <span className=\"uppercase tracking-wide\">"),
        (r"<div className=\"text-\[32px\] mb-\[12px\] opacity-60\">📭</div>", "<Inbox className=\"w-8 h-8 mb-[12px] opacity-60\" />")
    ],
    "src/components/StatusTimeline.jsx": [
        (r"'🔵'", "<Circle size={16} className=\"text-blue-500\" />"),
        (r"'🟡'", "<Clock size={16} className=\"text-amber\" />"),
        (r"'🔧'", "<Wrench size={16} className=\"text-gray-500\" />"),
        (r"'✅'", "<CheckCircle size={16} className=\"text-green\" />")
    ]
}

imports = {
    "src/pages/LandingPage.jsx": "import { Mic, Bot, MapPin, Bell, BarChart, Trophy, FileText, Smartphone } from 'lucide-react';\n",
    "src/pages/LoginPage.jsx": "import { Smartphone } from 'lucide-react';\n",
    "src/pages/AdminLoginPage.jsx": "",
    "src/pages/FileComplaint.jsx": "import { CheckCircle, Mic, Zap, Square, MapPin, Rocket, Bot } from 'lucide-react';\n",
    "src/pages/StateAdminDashboard.jsx": "import { ClipboardList, CheckCircle, Clock, MapPin, Inbox } from 'lucide-react';\n",
    "src/components/StatusTimeline.jsx": "import { Circle, Clock, Wrench, CheckCircle } from 'lucide-react';\n"
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
        # Add import after other imports
        lines = content.split('\n')
        last_import = 0
        for i, line in enumerate(lines):
            if line.startswith("import "):
                last_import = i
        lines.insert(last_import + 1, imports[file_path].strip())
        content = '\n'.join(lines)
        
    with open(full_path, "w") as f:
        f.write(content)
print("Done 1")
