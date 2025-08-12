// App.jsx
import React, { useState } from 'react';
import Part1 from './part1.jsx';
import Part2 from './part2.jsx';

export default function App() {
  const [step, setStep] = useState(1);
  const [currentTripId, setCurrentTripId] = useState(null);
  const [currentCountry, setCurrentCountry] = useState('');

  // 當 Part1 成功、呼叫 onNext 時
  const handleNext = ({ tripId, country }) => {
    setCurrentTripId(tripId);
    setCurrentCountry(country);
    setStep(2);
  };

  return (
    <div className="App">
      {step === 1 && (
        <Part1
          onNext={handleNext}
        />
      )}

      {step === 2 && (
        <Part2
          tripId={currentTripId}
          country={currentCountry}
        />
      )}
    </div>
  );
}
