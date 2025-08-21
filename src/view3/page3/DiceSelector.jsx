import React, { useState } from "react";
import "./DiceSelector.css";

const DiceSelector = () => {
  // 仍用瑞士景點做最後結果，但不顯示左邊清單
  const candidates = [
    "Matterhorn",
    "Jungfraujoch",
    "Lake Geneva",
    "Chapel Bridge",
    "Rhine Falls",
  ];

  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState(1); // 1~6，控制骰子朝向

  const rollDice = () => {
    if (rolling) return;

    setRolling(true);
    // 隨機出一個 1~6 的面
    const nextFace = Math.floor(Math.random() * 6) + 1;

    // 動畫跑 1.2 秒後停在對應的面，並選出結果
    setTimeout(() => {
      setFace(nextFace);
      const winner = candidates[(nextFace - 1) % candidates.length];
      setResult(winner);
      setRolling(false);
    }, 1200);
  };

  return (
    <div className="dice-only-wrapper">
      <div className="panel">
        <div className="title">Final Tiebreak</div>

        <div className="dice-stage">
          {/* 3D 骰子 */}
          <div
            className={`dice ${rolling ? "rolling" : `show-${face}`}`}
            aria-label={`dice showing ${face}`}
          >
            <div className="face one">
              <span className="pip center" />
            </div>
            <div className="face two">
              <span className="pip tl" />
              <span className="pip br" />
            </div>
            <div className="face three">
              <span className="pip tl" />
              <span className="pip center" />
              <span className="pip br" />
            </div>
            <div className="face four">
              <span className="pip tl" />
              <span className="pip tr" />
              <span className="pip bl" />
              <span className="pip br" />
            </div>
            <div className="face five">
              <span className="pip tl" />
              <span className="pip tr" />
              <span className="pip center" />
              <span className="pip bl" />
              <span className="pip br" />
            </div>
            <div className="face six">
              <span className="pip tl" />
              <span className="pip ml" />
              <span className="pip bl" />
              <span className="pip tr" />
              <span className="pip mr" />
              <span className="pip br" />
            </div>
          </div>
        </div>

        <div className="controls">
          <button
            className="roll-btn"
            onClick={rollDice}
            disabled={rolling}
            title="Roll the dice"
          >
            {rolling ? "Rolling..." : "Roll the Dice"}
          </button>
        </div>

        {result && (
          <div className="result-badge">
            🎉 Final Choice:&nbsp;<strong>{result}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceSelector;
