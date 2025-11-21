import React, { useState } from 'react';
import LoginPage from './components/Login';
import RegisterPage from './components/Register';
import Initial from './components/Initial';

function App() {
  // O estado 'view' define qual componente será exibido
  // const [view, setView] = useState('login'); 
  const [view, setView] = useState('initial'); 

  // Funções de navegação
  const switchToLogin = (e) => {
    if (e) e.preventDefault();
    setView('login');
  };

  const switchToRegister = (e) => {
    if (e) e.preventDefault();
    setView('register');
  };

  const switchToInitial = (e) => {
    if (e) e.preventDefault();
    setView('register');
  };

  return (
    <div className="App">
      {view === 'initial' ? (
        <Initial switchToRegister={switchToInitial} />
      ) : (
        <RegisterPage switchToLogin={switchToLogin} />
      )}
    </div>
  );
}

export default App;

// import { 
//   BookOpen, 
//   CreditCard, 
//   Headphones, 
//   MessageSquare, 
//   BookMarked, 
//   Library, 
//   GraduationCap, 
//   FileText, 
//   Mic, 
//   PenTool, 
//   Gamepad2, 
//   Lightbulb, 
//   Waves, 
//   Users, 
//   Languages, 
//   ClipboardCheck, 
//   Users2 
// } from 'lucide-react';

// export default function App() {
//   const categories = [
//     { name: 'Grammar', icon: BookOpen, color: 'bg-[#d32f2f]' },
//     { name: 'FlashCards', icon: CreditCard, color: 'bg-[#f57c00]' },
//     { name: 'Listening', icon: Headphones, color: 'bg-[#fbc02d]' },
//     { name: 'Speak with IA', icon: MessageSquare, color: 'bg-[#7cb342]' },
//     { name: 'Dictionary', icon: BookMarked, color: 'bg-[#00897b]' },
//     { name: 'My vocabulary', icon: Library, color: 'bg-[#00695c]' },
//     { name: 'Courses', icon: GraduationCap, color: 'bg-[#00acc1]' },
//     { name: 'Reading Comprehension', icon: FileText, color: 'bg-[#0288d1]' },
//     { name: 'Pronounce', icon: Mic, color: 'bg-[#5e35b1]' },
//     { name: 'Writing', icon: PenTool, color: 'bg-[#6a1b9a]' },
//     { name: 'Games', icon: Gamepad2, color: 'bg-[#8e24aa]' },
//     { name: 'Modern methodologies', icon: Lightbulb, color: 'bg-[#c2185b]' },
//     { name: 'Immersion', icon: Waves, color: 'bg-[#ad1457]' },
//     { name: 'Speak with natives', icon: Users, color: 'bg-[#5d4037]' },
//     { name: 'Translation Practice', icon: Languages, color: 'bg-[#455a64]' },
//     { name: 'Test your english level', icon: ClipboardCheck, color: 'bg-[#424242]' },
//     { name: 'Community', icon: Users2, color: 'bg-[#37474f]' },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <h1 className="text-gray-900">English Learning Platform</h1>
//           <nav className="flex gap-2 mt-4">
//             <button className="px-4 py-2 bg-gray-900 text-white rounded-lg transition-colors hover:bg-gray-800">
//               Home
//             </button>
//             <button className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg transition-colors hover:bg-gray-200">
//               Progress
//             </button>
//             <button className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg transition-colors hover:bg-gray-200">
//               Profile
//             </button>
//           </nav>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto px-6 py-12">
//         <div className="mb-8">
//           <h2 className="text-gray-900 mb-2">Choose Your Learning Path</h2>
//           <p className="text-gray-600">Select a category to start improving your English skills</p>
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//           {categories.map((category, index) => {
//             const Icon = category.icon;
//             return (
//               <button
//                 key={index}
//                 className={`${category.color} text-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[120px] transition-all hover:scale-105 hover:shadow-lg active:scale-95`}
//               >
//                 <Icon className="w-8 h-8" />
//                 <span className="text-center">{category.name}</span>
//               </button>
//             );
//           })}
//         </div>
//       </main>
//     </div>
//   );
// }
