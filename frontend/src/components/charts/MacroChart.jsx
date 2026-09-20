import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function MacroChart({ protein = 0, carbs = 0, fat = 0, dark }) {
  const data = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        data: [protein, carbs, fat],
        backgroundColor: [
          '#3b82f6', // blue for protein
          '#eab308', // yellow for carbs
          '#ec4899', // pink for fat
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    cutout: '75%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: dark ? '#1C1714' : '#ffffff',
        titleColor: dark ? '#FDF6F0' : '#1A1210',
        bodyColor: dark ? '#C9B8AE' : '#6B6560',
        borderColor: dark ? '#332E2B' : '#E5E5E5',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: function (context) {
            return ` ${context.label}: ${context.raw}g`;
          }
        }
      }
    },
  };

  if (protein === 0 && carbs === 0 && fat === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm italic" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>
        No macros logged today.
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[200px] mx-auto aspect-square">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>
          {Math.round(protein + carbs + fat)}g
        </span>
        <span className="text-xs" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>Total Macros</span>
      </div>
    </div>
  );
}
