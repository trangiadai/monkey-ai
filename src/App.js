import React, { useState, useEffect } from "react";
import "./App.css";

const POSITIONS = [0, 1, 2, 3, 4];

const App = () => {
  const initialState = {
    monkeyPos: 0,
    stickPos: 2,
    boxPos: 4,
    bananaPos: 3,
    onBox: false,
    hasStick: false,
    bananaDropped: false,
    isEaten: false,
    isSolving: false,
    steps: [],
    currentStepIdx: -1,
    isSelecting: null,
    selectedAlgo: "A*",
  };

  const [state, setState] = useState(initialState);

  const handleReset = () =>
    setState({ ...initialState, selectedAlgo: state.selectedAlgo });
  const updateState = (key, value) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const solveAI = () => {
    const getHeuristic = (m, s, b, ban, hS, oB, bD) => {
      if (bD && !oB && !hS && m === ban) return 0;
      if (bD) return 10 + Math.abs(m - ban) + (oB ? 5 : 0);
      if (oB) return 20 + (m === ban && hS ? 0 : 10);
      if (hS) return 30 + Math.abs(b - ban) + Math.abs(m - b);
      return 40 + Math.abs(m - s);
    };

    let openList = [
      {
        m: state.monkeyPos,
        s: state.stickPos,
        b: state.boxPos,
        ban: state.bananaPos,
        hS: false,
        oB: false,
        bD: false,
        path: [],
        g: 0,
        f: 0,
      },
    ];
    const visited = new Set();

    while (openList.length > 0) {
      let curr;
      if (state.selectedAlgo === "DFS") curr = openList.pop();
      else if (state.selectedAlgo === "BFS") curr = openList.shift();
      else {
        openList.sort((a, b) => a.f - b.f);
        curr = openList.shift();
      }

      const stateKey = `${curr.m}-${curr.s}-${curr.b}-${curr.hS}-${curr.oB}-${curr.bD}`;
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      if (curr.bD && !curr.oB && !curr.hS && curr.m === curr.ban) {
        return [
          ...curr.path,
          { action: `Ăn chuối tại ô ${curr.ban + 1} 😋`, pos: curr.ban },
        ];
      }

      const neighbors = [];
      if (!curr.oB) {
        POSITIONS.forEach((p) => {
          if (p !== curr.m)
            neighbors.push({
              ...curr,
              m: p,
              action: `Đi đến ô ${p + 1}`,
              pos: p,
            });
        });
      }
      if (curr.m === curr.s && !curr.hS && !curr.oB && !curr.bD) {
        neighbors.push({
          ...curr,
          hS: true,
          action: `Nhặt gậy tại ô ${curr.m + 1}`,
          pos: curr.m,
        });
      }
      if (curr.m === curr.b && !curr.oB && !curr.bD) {
        POSITIONS.forEach((p) => {
          if (p !== curr.b)
            neighbors.push({
              ...curr,
              m: p,
              b: p,
              s: curr.hS ? p : curr.s,
              action: `Đẩy bàn đến ô ${p + 1}`,
              pos: p,
            });
        });
      }
      if (curr.m === curr.b && !curr.bD) {
        neighbors.push({
          ...curr,
          oB: !curr.oB,
          action: curr.oB
            ? `Leo xuống tại ô ${curr.m + 1}`
            : `Leo lên bàn tại ô ${curr.m + 1}`,
          pos: curr.m,
        });
      }
      if (curr.oB && curr.m === curr.ban && curr.hS && !curr.bD) {
        neighbors.push({
          ...curr,
          bD: true,
          action: `Chọc chuối tại ô ${curr.m + 1} 🍌`,
          pos: curr.m,
        });
      }
      if (curr.bD && curr.oB) {
        neighbors.push({
          ...curr,
          oB: false,
          action: `Leo xuống tại ô ${curr.m + 1}`,
          pos: curr.m,
        });
      }
      if (curr.hS && curr.bD && !curr.oB) {
        neighbors.push({
          ...curr,
          hS: false,
          s: curr.m,
          action: `Bỏ gậy xuống ô ${curr.m + 1}`,
          pos: curr.m,
        });
      }

      neighbors.forEach((n) => {
        const g = curr.g + 1;
        const h = getHeuristic(n.m, n.s, n.b, n.ban, n.hS, n.oB, n.bD);
        let f = 0;
        if (state.selectedAlgo === "A*") f = g + h;
        else if (state.selectedAlgo === "GREEDY") f = h;
        else if (state.selectedAlgo === "UCS") f = g;
        openList.push({
          ...n,
          g,
          h,
          f,
          path: [...curr.path, { action: n.action, pos: n.pos }],
        });
      });
    }
    return [];
  };

  const handleSolve = () => {
    updateState("isSelecting", null);
    const result = solveAI();
    if (result.length > 0) {
      updateState("steps", result);
      updateState("currentStepIdx", 0);
      updateState("isSolving", true);
    }
  };

  useEffect(() => {
    if (state.isSolving && state.currentStepIdx < state.steps.length) {
      const timer = setTimeout(() => {
        const step = state.steps[state.currentStepIdx];
        if (step.action.includes("Đi đến") || step.action.includes("Đẩy bàn"))
          updateState("monkeyPos", step.pos);
        if (step.action.includes("Đẩy bàn")) updateState("boxPos", step.pos);
        if (step.action.includes("Nhặt gậy")) updateState("hasStick", true);
        if (step.action.includes("Leo lên")) updateState("onBox", true);
        if (step.action.includes("Chọc")) updateState("bananaDropped", true);
        if (step.action.includes("Bỏ gậy")) {
          updateState("hasStick", false);
          updateState("stickPos", state.monkeyPos);
        }
        if (step.action.includes("Leo xuống")) updateState("onBox", false);
        if (step.action.includes("Ăn chuối")) updateState("isEaten", true);
        updateState("currentStepIdx", state.currentStepIdx + 1);
      }, 900);
      return () => clearTimeout(timer);
    } else if (
      state.currentStepIdx === state.steps.length &&
      state.steps.length > 0
    ) {
      updateState("isSolving", false);
    }
  }, [state.isSolving, state.currentStepIdx, state.steps]);

  return (
    <div className="app-container">
      <header>
        <div className="logo-section">
          <h2>Monkey AI Solver</h2>
          <span className="algo-tag">Mode: {state.selectedAlgo}</span>
        </div>
        <div className="controls">
          <button
            className={`btn ${state.isSelecting === "banana" ? "active" : ""}`}
            onClick={() => updateState("isSelecting", "banana")}
          >
            🍌 Chuối
          </button>
          <button
            className={`btn ${state.isSelecting === "stick" ? "active" : ""}`}
            onClick={() => updateState("isSelecting", "stick")}
          >
            🥢 Gậy
          </button>
          <button
            className={`btn ${state.isSelecting === "box" ? "active" : ""}`}
            onClick={() => updateState("isSelecting", "box")}
          >
            🪑 Bàn
          </button>

          <div className="divider"></div>

          <div className="select-wrapper">
            <span className="select-label">Giải thuật:</span>
            <select
              className="algo-select"
              value={state.selectedAlgo}
              onChange={(e) => updateState("selectedAlgo", e.target.value)}
              disabled={state.isSolving}
            >
              <option value="A*">A* Search</option>
              <option value="GREEDY">Greedy Best-First</option>
              <option value="BFS">BFS (Breadth-First)</option>
              <option value="DFS">DFS (Depth-First)</option>
              <option value="UCS">UCS (Uniform Cost)</option>
            </select>
          </div>

          <button
            className="btn solve-btn"
            onClick={handleSolve}
            disabled={state.isSolving || state.steps.length > 0}
          >
            🚀 GIẢI
          </button>
          <button className="btn reset-btn" onClick={handleReset}>
            🔄 LÀM MỚI
          </button>
        </div>
      </header>

      <main className="main-layout">
        <section className="game-section">
          <div className="game-screen">
            <div className="ceiling">
              {POSITIONS.map((p) => (
                <div
                  key={p}
                  className={`cell ${state.isSelecting === "banana" ? "guide-active" : ""}`}
                  onClick={() =>
                    state.isSelecting === "banana" &&
                    updateState("bananaPos", p)
                  }
                >
                  {state.bananaPos === p && !state.bananaDropped && (
                    <span className="entity">🍌</span>
                  )}
                </div>
              ))}
            </div>
            <div className="floor">
              {POSITIONS.map((p) => (
                <div
                  key={p}
                  className={`cell ${["stick", "box"].includes(state.isSelecting) ? "guide-active" : ""}`}
                  onClick={() => {
                    if (state.isSelecting === "stick")
                      updateState("stickPos", p);
                    if (state.isSelecting === "box") updateState("boxPos", p);
                  }}
                >
                  {state.boxPos === p && <div className="box-entity">🪑</div>}
                  {state.stickPos === p && !state.hasStick && (
                    <div
                      className="stick-entity"
                      style={{ bottom: state.boxPos === p ? "42px" : "8px" }}
                    >
                      🥢
                    </div>
                  )}
                  {state.bananaPos === p &&
                    state.bananaDropped &&
                    !state.isEaten && (
                      <div className="entity banana-fall">🍌</div>
                    )}
                  {state.monkeyPos === p && (
                    <div
                      className="monkey-entity"
                      style={{ bottom: state.onBox ? "55px" : "0" }}
                    >
                      <div style={{ position: "relative" }}>
                        {state.hasStick && (
                          <span className="stick-hand">🥢</span>
                        )}
                        <span className="monkey-body">🐒</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="steps-section">
          <div className="sidebar-header">LỘ TRÌNH ({state.selectedAlgo})</div>
          <div className="steps-list">
            {state.steps.length === 0 && (
              <p className="empty-msg">Chọn giải thuật và nhấn Giải...</p>
            )}
            {state.steps.map((s, i) => (
              <div
                key={i}
                className={`step-row ${i === state.currentStepIdx - 1 ? "active-row" : ""}`}
              >
                <span className="step-num">{i + 1}.</span>
                <span className="step-text">{s.action}</span>
                {i === state.currentStepIdx - 1 && (
                  <span className="arrow-pointer">◀</span>
                )}
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
