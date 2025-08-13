import React, { useState } from "react";
import "./DiceSelector.css";

const DiceSelector = () => {
  // 寫死的平手行程（瑞士景點英文）
  const tiedTrips = [
    "Matterhorn",
    "Jungfraujoch",
    "Lake Geneva",
    "Chapel Bridge",
    "Rhine Falls"
  ];

  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);

  const rollDice = () => {
    setRolling(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * tiedTrips.length);
      setResult(tiedTrips[randomIndex]);
      setRolling(false);
    }, 1000);
  };

  return (
    <div className="dice-container">
      {/* 左邊：平手行程列表 */}
      <div className="tied-trips">
        <h2>Tied Trips</h2>
        <ul>
          {tiedTrips.map((trip, index) => (
            <li key={index}>{trip}</li>
          ))}
        </ul>
      </div>

      {/* 右邊：骰子區 */}
      <div className="dice-area">
        <button onClick={rollDice} disabled={rolling} className="roll-btn">
          {rolling ? "Rolling..." : "Roll the Dice"}
        </button>
        {result && (
          <div className="result">
            🎉 Final Choice: <strong>{result}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceSelector;
