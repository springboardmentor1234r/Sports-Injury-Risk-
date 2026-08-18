import React from 'react';
import AthleteCard from './AthleteCard';

const AthleteList = () => {
  const athletes = [
    { id: 1, name: 'Alex Johnson', sport: 'Basketball', riskScore: 12, avatar: null },
    { id: 2, name: 'Sarah Williams', sport: 'Soccer', riskScore: 45, avatar: null },
    { id: 3, name: 'Mike Brown', sport: 'Tennis', riskScore: 88, avatar: null },
    { id: 4, name: 'Emily Davis', sport: 'Track', riskScore: 5, avatar: null },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {athletes.map(athlete => (
        <AthleteCard key={athlete.id} athlete={athlete} />
      ))}
    </div>
  );
};

export default AthleteList;
