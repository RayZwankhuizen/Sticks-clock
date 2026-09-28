import React from 'react';
import { ClockGrid } from '../components/KineticClock';

export const HomePage = () => {
  return (
    <div className="min-h-screen w-full bg-background overflow-hidden">
      <ClockGrid />
    </div>
  );
};

export default HomePage;
