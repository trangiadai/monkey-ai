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
    const queue = [
      {
        m: state.monkeyPos,
        s: state.stickPos,
        b: state.boxPos,
        ban: state.bananaPos,
        hS: false,
        oB: false,
        bD: false,
        path: [],
      },
    ];
    const visited = new Set();

    while (queue.length > 0) {
      const curr = queue.shift();
      const stateKey = `${curr.m}-${curr.s}-${curr.b}-${curr.hS}-${curr.oB}-${curr.bD}`;
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      // Điều kiện thắng: Đã rơi chuối, đang ở dưới đất, không cầm gậy và đứng đúng ô chuối
      if (curr.bD && !curr.oB && !curr.hS && curr.m === curr.ban) {
        return [
          ...curr.path,
          { action: `NHẶT ĂN CHUỐI TẠI Ô ${curr.ban + 1} 😋`, pos: curr.ban },
        ];
      }

      // 1. Di chuyển (khi ở dưới đất)
      if (!curr.oB) {
        POSITIONS.forEach((p) => {
          if (p !== curr.m)
            queue.push({
              ...curr,
              m: p,
              path: [...curr.path, { action: `Đi đến ô ${p + 1}`, pos: p }],
            });
        });
      }

      // 2. Nhặt gậy
      if (curr.m === curr.s && !curr.hS && !curr.oB && !curr.bD) {
        queue.push({
          ...curr,
          hS: true,
          path: [
            ...curr.path,
            { action: `Nhặt cây gậy tại ô ${curr.m + 1}`, pos: curr.m },
          ],
        });
      }

      // 3. Đẩy bàn
      if (curr.m === curr.b && !curr.oB && !curr.bD) {
        POSITIONS.forEach((p) => {
          if (p !== curr.b)
            queue.push({
              ...curr,
              m: p,
              b: p,
              s: curr.hS ? p : curr.s,
              path: [
                ...curr.path,
                { action: `Đẩy bàn đến ô ${p + 1}`, pos: p },
              ],
            });
        });
      }

      // 4. Leo lên bàn
      if (curr.m === curr.b && !curr.oB && !curr.bD) {
        queue.push({
          ...curr,
          oB: true,
          path: [
            ...curr.path,
            { action: `Leo lên bàn tại ô ${curr.m + 1}`, pos: curr.m },
          ],
        });
      }

      // 5. Chọc chuối (trên bàn, có gậy, đúng vị trí chuối)
      if (curr.oB && curr.m === curr.ban && curr.hS && !curr.bD) {
        queue.push({
          ...curr,
          bD: true,
          path: [
            ...curr.path,
            {
              action: `Chọc cho chuối rơi tại ô ${curr.m + 1} 🍌`,
              pos: curr.m,
            },
          ],
        });
      }

      // 6. Bỏ gậy xuống đất sau khi chuối rơi
      if (curr.hS && curr.bD) {
        queue.push({
          ...curr,
          hS: false,
          s: curr.m,
          path: [
            ...curr.path,
            { action: `Bỏ cây gậy xuống tại ô ${curr.m + 1}`, pos: curr.m },
          ],
        });
      }

      // 7. Leo xuống đất
      if (curr.oB) {
        queue.push({
          ...curr,
          oB: false,
          path: [
            ...curr.path,
            { action: `Leo xuống đất tại ô ${curr.m + 1}`, pos: curr.m },
          ],
        });
      }
    }
    return [];
  };

  const handleSolve = () => {
    updateState("isSelecting", null);
    const result = solveAI();
    updateState("steps", result);
    updateState("currentStepIdx", 0);
    updateState("isSolving", true);
  };

  useEffect(() => {
    if (state.isSolving && state.currentStepIdx < state.steps.length) {
      const timer = setTimeout(() => {
        const step = state.steps[state.currentStepIdx];
        if (step.action.includes("Đi đến") || step.action.includes("Đẩy bàn"))
          updateState("monkeyPos", step.pos);
        if (step.action.includes("Đẩy bàn")) updateState("boxPos", step.pos);
        if (step.action.includes("Nhặt cây gậy")) updateState("hasStick", true);
        if (step.action.includes("Leo lên")) updateState("onBox", true);
        if (step.action.includes("Chọc")) updateState("bananaDropped", true);
        if (step.action.includes("Bỏ cây gậy")) {
          updateState("hasStick", false);
          updateState("stickPos", state.monkeyPos);
        }
        if (step.action.includes("Leo xuống")) updateState("onBox", false);
        if (step.action.includes("NHẶT ĂN")) updateState("isEaten", true);

        updateState("currentStepIdx", state.currentStepIdx + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state.currentStepIdx === state.steps.length) {
      updateState("isSolving", false);
    }
  }, [state.isSolving, state.currentStepIdx, state.steps, state.monkeyPos]);

  return (
    <div className="app-container">
      <header>
        <h2>Monkey AI Solver</h2>
        <div className="controls">
          <button
            className={`btn ${state.isSelecting === "banana" ? "active-btn" : ""}`}
            onClick={() => updateState("isSelecting", "banana")}
          >
            🍌 Chuối
          </button>
          <button
            className={`btn ${state.isSelecting === "stick" ? "active-btn" : ""}`}
            onClick={() => updateState("isSelecting", "stick")}
          >
            🥢 Gậy
          </button>
          <button
            className={`btn ${state.isSelecting === "box" ? "active-btn" : ""}`}
            onClick={() => updateState("isSelecting", "box")}
          >
            🪑 Bàn
          </button>
          <button
            className="btn solve"
            onClick={handleSolve}
            disabled={state.isSolving || state.steps.length > 0}
          >
            🚀 GIẢI
          </button>
          <button className="btn reset" onClick={handleReset}>
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
                      style={{ bottom: state.boxPos === p ? "40px" : "5px" }}
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
                      style={{ bottom: state.onBox ? "50px" : "0" }}
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
          <h4>
            <center>Lộ trình giải</center>
          </h4>
          <div className="steps-list">
            {state.steps.length === 0 && (
              <p className="empty-msg">Chưa có dữ liệu...</p>
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
        .app-container { height: 100vh; display: flex; flex-direction: column; padding: 10px 20px; box-sizing: border-box; background: #fdfdfd; overflow: hidden; }
        header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #eee; }
        h2 { margin: 0; color: #5d4037; font-size: 1.2rem; }
        .controls { display: flex; gap: 8px; }
        .main-layout { display: flex; flex: 1; gap: 15px; padding: 10px 0; height: calc(100vh - 80px); }
        .game-section { flex: 7; position: relative; }
        .game-screen { height: 100%; border: 4px solid #3e2723; border-radius: 12px; background: #fffde7; position: relative; display: flex; flex-direction: column; }
        .ceiling { display: flex; justify-content: space-around; height: 35%; align-items: flex-start; padding-top: 10px; }
        .floor { display: flex; justify-content: space-around; height: 35%; align-items: flex-end; position: absolute; bottom: 0; width: 100%; }
        .cell { width: 18%; height: 80px; display: flex; justify-content: center; align-items: center; border-top: 3px solid #5d4037; position: relative; }
        .ceiling .cell { border-top: none; border-bottom: 2px dashed #eee; height: 100px; }
        .guide-active { border: 2px dashed #2196f3 !important; background: rgba(33, 150, 243, 0.05); cursor: pointer; border-radius: 8px; }
        .guide-active:hover { background: rgba(33, 150, 243, 0.15); }
        .entity { font-size: 45px; z-index: 5; }
        .box-entity { position: absolute; bottom: 0; font-size: 65px; z-index: 1; }
        .stick-entity { position: absolute; font-size: 40px; transform: rotate(-45deg); z-index: 2; }
        .monkey-entity { position: absolute; font-size: 60px; transition: all 0.6s ease-in-out; z-index: 10; }
        .stick-hand { position: absolute; top: -25px; right: -15px; font-size: 40px; transform: rotate(15deg); }
        .steps-section { flex: 3; background: #fff; border: 1px solid #ddd; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 2px 2px 10px rgba(0,0,0,0.05); }
        .steps-list { overflow-y: auto; padding: 10px; flex: 1; }
        .step-row { display: flex; align-items: center; padding: 8px; margin-bottom: 6px; border-radius: 6px; background: #f9f9f9; font-size: 0.9rem; position: relative; }
        .active-row { background: #fff9c4; border: 1px solid #fbc02d; font-weight: bold; }
        .step-num { min-width: 24px; color: #999; font-size: 0.8rem; }
        .arrow-pointer { position: absolute; right: 5px; color: #d32f2f; animation: blink 0.5s infinite; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } }
        .banana-fall { position: absolute; bottom: 0; animation: drop 0.6s ease-in forwards; }
        @keyframes drop { 0% { transform: translateY(-250px); } 100% { transform: translateY(0); } }
        .btn { padding: 8px 14px; cursor: pointer; border-radius: 6px; border: 1px solid #ddd; font-weight: bold; font-size: 0.85rem; }
        .solve { background: #2e7d32; color: white; border: none; }
        .reset { background: #c62828; color: white; border: none; }
        .active-btn { background: #e3f2fd; border-color: #2196f3; }
      `}</style>
    </div>
  );
};

export default App;
