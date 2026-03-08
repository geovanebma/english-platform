import React from 'react' // <--- ADICIONE ESTA LINHA AQUI
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// import { motion } from 'motion/react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  CreditCard, 
  Headphones, 
  MessageSquare, 
  BookMarked, 
  Library, 
  GraduationCap, 
  FileText, 
  Volume2, 
  Pencil, 
  Gamepad2, 
  Lightbulb, 
  Waves, 
  Users, 
  Languages, 
  ClipboardCheck,
  User
} from 'lucide-react';

const categories = [
  { id: 1, color: '#b82121', label: 'Grammar', icon: BookOpen },
  { id: 2, color: '#ed5215', label: 'FlashCards', icon: CreditCard },
  { id: 3, color: '#F1C40F', label: 'Listening', icon: Headphones },
  { id: 4, color: '#9eed15', label: 'Speak with IA', icon: MessageSquare },
  { id: 5, color: '#2eab15', label: 'Dictionary', icon: BookMarked },
  { id: 6, color: '#096105', label: 'My vocabulary', icon: Library },
  { id: 7, color: '#009982', label: 'Courses', icon: GraduationCap },
  { id: 8, color: '#0e94b5', label: 'Reading Comprehension', icon: FileText },
  { id: 9, color: '#085163', label: 'Pronnounce', icon: Volume2 },
  { id: 10, color: '#122987', label: 'Writing', icon: Pencil },
  { id: 11, color: '#5902b0', label: 'Games', icon: Gamepad2 },
  { id: 12, color: '#a61b57', label: 'Modern methodologies', icon: Lightbulb },
  { id: 13, color: '#b00245', label: 'Immersion', icon: Waves },
  { id: 14, color: '#ad9a6f', label: 'Speak with natives', icon: Users },
  { id: 15, color: '#573a22', label: 'Translation Practice', icon: Languages },
  { id: 16, color: '#606160', label: 'Test your english level', icon: ClipboardCheck },
  { id: 17, color: '#333333', label: 'Community', icon: User },
];

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> {/* CORRIGIDO: Use o componente 'App' */}
  </React.StrictMode>,
)