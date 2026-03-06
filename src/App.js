import React, { useState, useEffect } from "react";

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
  };

  const [state, setState] = useState(initialState);

  const handleReset = () => setState(initialState);
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
      openList.sort((a, b) => a.f - b.f);
      const curr = openList.shift();
      const stateKey = `${curr.m}-${curr.s}-${curr.b}-${curr.hS}-${curr.oB}-${curr.bD}`;
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      if (curr.bD && !curr.oB && !curr.hS && curr.m === curr.ban) {
        return [
          ...curr.path,
          { action: `ĂN CHUỐI TẠI Ô ${curr.ban + 1} 😋`, pos: curr.ban },
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
        openList.push({
          ...n,
          g,
          h,
          f: g + h,
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
        if (step.action.includes("ĂN CHUỐI")) updateState("isEaten", true);
        updateState("currentStepIdx", state.currentStepIdx + 1);
      }, 800);
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
          <span className="algo-tag">Algorithm: A* Search</span>
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
          <div className="sidebar-header">LỘ TRÌNH THỰC HIỆN</div>
          <div className="steps-list">
            {state.steps.length === 0 && (
              <p className="empty-msg">
                Thiết lập vị trí và nhấn Giải để bắt đầu...
              </p>
            )}
            {state.steps.map((s, i) => (
              <div
                key={i}
                className={`step-row ${i === state.currentStepIdx - 1 ? "active-row" : ""}`}
              >
                <span className="step-num">{i + 1}</span>
                <span className="step-text">{s.action}</span>
                {i === state.currentStepIdx - 1 && (
                  <span className="arrow-pointer">◀</span>
                )}
              </div>
            ))}
          </div>
        </aside>
      </main>

      <style>{`
        .app-container { height: 100vh; display: flex; flex-direction: column; padding: 15px 25px; box-sizing: border-box; background: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; overflow: hidden; }
        header { display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 15px; }
        h2 { margin: 0; color: #3e2723; font-size: 1.3rem; }
        .algo-tag { font-size: 0.75rem; color: #795548; font-weight: bold; background: #efebe9; padding: 2px 8px; border-radius: 4px; }
        .controls { display: flex; gap: 10px; align-items: center; }
        .divider { width: 1px; height: 25px; background: #ddd; margin: 0 5px; }
        
        .main-layout { display: flex; flex: 1; gap: 20px; height: calc(100vh - 100px); }
        .game-section { flex: 7; height: 100%; }
        .game-screen { height: 100%; border: 4px solid #5d4037; border-radius: 15px; background: #fffde7; position: relative; overflow: hidden; }
        
        .ceiling { display: flex; justify-content: space-around; height: 40%; width: 100%; padding-top: 15px; }
        .floor { display: flex; justify-content: space-around; height: 40%; width: 100%; position: absolute; bottom: 0; align-items: flex-end; }
        .cell { width: 18%; height: 90px; display: flex; justify-content: center; align-items: center; border-top: 3px solid #d7ccc8; position: relative; }
        .ceiling .cell { border-top: none; border-bottom: 2px dashed #eeeeee; }
        
        .guide-active { border: 2.5px dashed #2196f3 !important; background: rgba(33, 150, 243, 0.08); cursor: pointer; border-radius: 10px; }
        .entity { font-size: 50px; z-index: 5; }
        .box-entity { position: absolute; bottom: 0; font-size: 70px; z-index: 1; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.1)); }
        .stick-entity { position: absolute; font-size: 45px; transform: rotate(-45deg); z-index: 2; }
        .monkey-entity { position: absolute; font-size: 65px; transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); z-index: 10; }
        .stick-hand { position: absolute; top: -30px; right: -15px; font-size: 45px; transform: rotate(15deg); }

        .steps-section { flex: 3; background: white; border-radius: 15px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e0e0e0; }
        .sidebar-header { background: #5d4037; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 0.9rem; letter-spacing: 1px; }
        .steps-list { overflow-y: auto; padding: 15px; flex: 1; background: #fafafa; }
        .step-row { display: flex; align-items: center; padding: 12px; margin-bottom: 8px; border-radius: 10px; background: white; border: 1px solid #f0f0f0; transition: 0.3s; position: relative; }
        .active-row { background: #fff9c4; border-color: #fbc02d; transform: scale(1.02); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .step-num { min-width: 28px; color: #bcaaa4; font-weight: bold; font-size: 0.8rem; }
        .step-text { color: #4e342e; font-size: 0.9rem; font-weight: 500; }
        .arrow-pointer { position: absolute; right: 10px; color: #d32f2f; font-weight: bold; }

        .btn { padding: 8px 16px; cursor: pointer; border-radius: 8px; border: 1px solid #d7ccc8; font-weight: bold; background: white; color: #5d4037; transition: 0.2s; }
        .btn:hover:not(:disabled) { background: #f5f5f5; color: #000000; transform: translateY(-1px); }
        .btn.active { background: #e3f2fd; border-color: #2196f3; color: #1976d2; }
        .solve-btn { background: #2e7d32; color: white; border: none; box-shadow: 0 2px 5px rgba(46, 125, 50, 0.3); }
        .reset-btn { background: #c62828; color: white; border: none; box-shadow: 0 2px 5px rgba(198, 40, 40, 0.3); }
        .solve-btn:disabled { background: #a5d6a7; cursor: not-allowed; }

        .banana-fall { position: absolute; bottom: 0; animation: drop 0.7s ease-in forwards; }
        @keyframes drop { 0% { transform: translateY(-250px); } 100% { transform: translateY(0); } }
        .empty-msg { color: #9e9e9e; text-align: center; margin-top: 20px; font-style: italic; font-size: 0.9rem; }
      `}</style>
    </div>
  );
};

export default App;
