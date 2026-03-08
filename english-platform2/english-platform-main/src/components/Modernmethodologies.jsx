tsx
import React from 'react';
import { BookOpen, Brain, Lightbulb, Code } from 'lucide-react';

const methodologies = [
  {
    title: 'Task-Based Learning',
    description: 'Foca em tarefas reais para praticar o idioma.',
    icon: BookOpen,
  },
  {
    title: 'Content-Based Instruction',
    description: 'Integra conteúdo de interesse ao aprendizado.',
    icon: Brain,
  },
  {
    title: 'Flipped Classroom',
    description: 'Estudo prévio online, prática presencial.',
    icon: Lightbulb,
  },
  {
    title: 'Gamified Learning',
    description: 'Uso de mecânicas de jogos para engajar.',
    icon: Code,
  },
];

/* Card individual para cada metodologia */
function MethodologyCard({ title, description, Icon }: { title: string; description: string; Icon: React.ComponentType<any>; }) {
  return (
    <article className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <Icon className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-4" aria-hidden="true" />
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 text-center">{title}</h3>
      <p className="text-center text-gray-600 dark:text-gray-400">{description}</p>
    </article>
  );
}

/* Componente principal */
export default function ModernMethodologies() {
  return (
    <section className="max-w-5xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
        Modern Methodologies
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {methodologies.map(({ title, description, icon: Icon }, idx) => (
          <MethodologyCard
            key={idx}
            title={title}
            description={description}
            Icon={Icon}
          />
        ))}
      </div>
    </section>
  );
}