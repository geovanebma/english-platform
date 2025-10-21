import React, { useState } from 'react';
import ReactDOM from 'react-dom/client'
import App from '../App.jsx'
import '../initial.css'
// import { motion } from 'motion/react';
import { motion } from 'framer-motion';

import Grammar from '../components/Grammar.jsx';
import Flashcards from '../components/Flashcards.jsx';

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

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App /> {/* CORRIGIDO: Use o componente 'App' */}
//   </React.StrictMode>,
// )

export default function InitialPage() {
    const [currentView, setCurrentView] = useState('initial');

    const handleCategoryClick = (type) => {
        // Apenas mude o estado. Isso é tudo!
        setCurrentView(type); 
    };

    if (currentView === 'Grammar') {
        return <Grammar setCurrentView={setCurrentView} color={"#b82121"}/>;
    }

    if (currentView === 'FlashCards') { // Use o 'label' do seu array de categorias
        return <Flashcards setCurrentView={setCurrentView}  color={"#ed5215"}/>;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation Bar */}
            <nav className="bg-black text-white px-6 py-4 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <h1 className="text-white">English Learning Platform</h1>
                    <div className="flex gap-6">
                        <button className="text-white hover:text-gray-300 transition-colors">Home</button>
                        <button className="text-white hover:text-gray-300 transition-colors">Progress</button>
                        <button className="text-white hover:text-gray-300 transition-colors">Profile</button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-gray-900 mb-3">Choose Your Learning Path</h2>
                    <p className="text-gray-600">Select a category to start improving your English skills</p>
                </div>

                {/* Innovative Button Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {categories.map((category, index) => {
                        const Icon = category.icon;
                        return (
                            <motion.button
                                key={category.id}
                                onClick={() => handleCategoryClick(category.label)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: index * 0.05,
                                    ease: "easeOut"
                                }}
                                whileHover={{
                                    scale: 1.05,
                                    rotate: 1,
                                    transition: { duration: 0.2 }
                                }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative overflow-hidden rounded-2xl p-6 aspect-square flex flex-col items-center justify-center gap-4 transition-all duration-300 shadow-lg hover:shadow-2xl"
                                style={{
                                    backgroundColor: category.color,
                                }}
                            >
                                {/* Gradient Overlay on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Icon */}
                                <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                                    <Icon className="w-12 h-12 text-white drop-shadow-lg" />
                                </div>

                                {/* Label */}
                                <span className="relative z-10 text-white text-center drop-shadow-md">
                                    {category.label}
                                </span>

                                {/* Animated Border */}
                                <motion.div
                                    className="absolute inset-0 rounded-2xl"
                                    style={{
                                        border: '3px solid rgba(255, 255, 255, 0.3)',
                                    }}
                                    initial={{ opacity: 0 }}
                                    whileHover={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            </motion.button>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}