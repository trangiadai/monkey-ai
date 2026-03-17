import React, { useState, useEffect } from "react";
import Tree from "react-d3-tree";
import "./App.css";

const POSITIONS = [0, 1, 2, 3, 4];

// 2. Định nghĩa hàm tiện ích để biến mảng phẳng thành cấu trúc cây lồng nhau
const buildNestedTree = (flatNodes) => {
  if (!flatNodes || flatNodes.length === 0) return null;
  const nodeMap = {};
  // Tạo bản đồ các node
  flatNodes.forEach((node) => {
    nodeMap[node.id] = { ...node, children: [] };
  });
  let root = null;
  flatNodes.forEach((node) => {
    if (node.parentId === null) {
      root = nodeMap[node.id];
    } else if (nodeMap[node.parentId]) {
      nodeMap[node.parentId].children.push(nodeMap[node.id]);
    }
  });
  return root;
};

// 3. Định nghĩa cách hiển thị cho mỗi Node (Custom Node)
const renderCustomNode = ({ nodeDatum, toggleNode }) => {
  // 1. Logic màu sắc của Node (Vòng tròn)
  let nodeColor = "#fff";
  let strokeColor = "#ccc";
  if (nodeDatum.id === "root") {
    nodeColor = "#3b82f6";
    strokeColor = "#1d4ed8";
  } else if (nodeDatum.isGoal) {
    nodeColor = "#4caf50";
    strokeColor = "#1b5e20";
  } else if (nodeDatum.isExplored) {
    nodeColor = "#1e293b";
    strokeColor = "#000";
  }

  // 2. Logic màu sắc và độ dày của CHỮ
  const textColor = nodeDatum.isGoal ? "#e11d48" : "#001f3f";
  const fontWeight = nodeDatum.isGoal ? "400" : "600";
  const fontSize = "11px";

  return (
    <g>
      <circle
        r="12"
        fill={nodeColor}
        stroke={strokeColor}
        strokeWidth="2"
        onClick={toggleNode}
        style={{ cursor: "pointer" }}
      />

      {/* Văn bản Hành động */}
      <text
        fill={textColor}
        x="20"
        y="-3"
        style={{
          fontWeight: fontWeight,
          fontSize: fontSize,
          transition: "all 0.3s ease",
        }}
      >
        {nodeDatum.name || "GỐC"}
      </text>

      {/* Văn bản chỉ số f */}
      <text
        fill={textColor}
        x="20"
        y="10"
        style={{
          fontWeight: fontWeight,
          fontSize: fontSize,
          transition: "all 0.3s ease",
        }}
      >
        {`f: ${nodeDatum.attributes?.f}`}
      </text>
    </g>
  );
};

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
    viewMode: "dashboard", // Thêm để chuyển tab
    fullTreeData: null, // Lưu cấu trúc cây lồng nhau
    stats: {
      totalStates: 0,
      finalCost: 0,
      initialConfig: "",
    },
  };

  const [state, setState] = useState(initialState);

  const handleReset = () =>
    setState({
      ...initialState,
      selectedAlgo: state.selectedAlgo,
      viewMode: state.viewMode,
    });

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
    const rootNode = {
      id: "root",
      parentId: null,
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
      h: 0,
    };

    let openList = [rootNode];
    const visited = new Set();
    const allGeneratedNodes = [rootNode];
    let exploredCount = 0;
    const initialConfigStr = `M:${state.monkeyPos + 1}, S:${state.stickPos + 1}, B:${state.boxPos + 1}, Ban:${state.bananaPos + 1}`;

    while (openList.length > 0) {
      if (state.selectedAlgo === "DFS") openList.sort((a, b) => 0);
      else if (state.selectedAlgo !== "BFS") openList.sort((a, b) => a.f - b.f);

      let curr =
        state.selectedAlgo === "DFS" ? openList.pop() : openList.shift();
      const stateKey = `${curr.m}-${curr.s}-${curr.b}-${curr.hS}-${curr.oB}-${curr.bD}`;

      if (visited.has(stateKey)) continue;
      visited.add(stateKey);
      exploredCount++;

      const flatNodeIndex = allGeneratedNodes.findIndex(
        (n) => n.id === curr.id,
      );
      if (flatNodeIndex !== -1) {
        allGeneratedNodes[flatNodeIndex].isExplored = true;
      }

      // KIỂM TRA ĐÍCH
      if (curr.bD && !curr.oB && !curr.hS && curr.m === curr.ban) {
        updateState("stats", {
          totalStates: exploredCount,
          finalCost: curr.g,
          initialConfig: initialConfigStr,
        });
        // Đánh dấu node đích
        allGeneratedNodes[flatNodeIndex].isGoal = true;
        // Xây dựng cây lồng nhau
        const nestedTree = buildNestedTree(allGeneratedNodes);
        updateState("fullTreeData", nestedTree);
        return [
          ...curr.path,
          { action: `Ăn chuối 😋`, pos: curr.ban, f: curr.g, g: curr.g, h: 0 },
        ];
      }

      const neighbors = [];
      // Logic neighbors giữ nguyên của bạn...
      if (!curr.oB)
        POSITIONS.forEach(
          (p) =>
            p !== curr.m &&
            neighbors.push({
              ...curr,
              m: p,
              action: `Đi đến ô ${p + 1}`,
              pos: p,
            }),
        );
      if (curr.m === curr.s && !curr.hS && !curr.oB && !curr.bD)
        neighbors.push({
          ...curr,
          hS: true,
          action: `Nhặt gậy ô ${curr.m + 1}`,
          pos: curr.m,
        });
      if (curr.m === curr.b && !curr.oB && !curr.bD)
        POSITIONS.forEach(
          (p) =>
            p !== curr.b &&
            neighbors.push({
              ...curr,
              m: p,
              b: p,
              s: curr.hS ? p : curr.s,
              action: `Đẩy bàn ô ${p + 1}`,
              pos: p,
            }),
        );
      if (curr.m === curr.b && !curr.bD)
        neighbors.push({
          ...curr,
          oB: !curr.oB,
          action: curr.oB
            ? `Leo xuống ô ${curr.m + 1}`
            : `Leo lên bàn ô ${curr.m + 1}`,
          pos: curr.m,
        });
      if (curr.oB && curr.m === curr.ban && curr.hS && !curr.bD)
        neighbors.push({
          ...curr,
          bD: true,
          action: `Chọc chuối ô ${curr.m + 1} 🍌`,
          pos: curr.m,
        });
      if (curr.bD && curr.oB)
        neighbors.push({
          ...curr,
          oB: false,
          action: `Leo xuống ô ${curr.m + 1}`,
          pos: curr.m,
        });
      if (curr.hS && curr.bD && !curr.oB)
        neighbors.push({
          ...curr,
          hS: false,
          s: curr.m,
          action: `Bỏ gậy ô ${curr.m + 1}`,
          pos: curr.m,
        });

      neighbors.forEach((n, idx) => {
        const g = curr.g + 1;
        const h = getHeuristic(n.m, n.s, n.b, n.ban, n.hS, n.oB, n.bD);
        let f =
          state.selectedAlgo === "A*"
            ? g + h
            : state.selectedAlgo === "GREEDY"
              ? h
              : g;

        const newNode = {
          ...n,
          id: `${curr.id}-${idx}`,
          parentId: curr.id,
          name: n.action, // Thư viện cần thuộc tính name
          g,
          h,
          f,
          isExplored: false, // Mặc định là chưa duyệt
          isGoal: false,
          // Định dạng lại attributes cho thư viện
          attributes: { action: n.action, f, g, h },
          path: [...curr.path, { action: n.action, pos: n.pos, f, g, h }],
        };

        // QUAN TRỌNG: Đẩy vào openList để duyệt và allGeneratedNodes để vẽ
        allGeneratedNodes.push(newNode);
        openList.push(newNode);
      });
    }

    const nestedTree = buildNestedTree(allGeneratedNodes);
    updateState("fullTreeData", nestedTree);
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
      }, 1000);
      return () => clearTimeout(timer);
    } else if (
      state.currentStepIdx === state.steps.length &&
      state.steps.length > 0
    ) {
      updateState("isSolving", false);
    }
  }, [state.isSolving, state.currentStepIdx, state.steps, state.monkeyPos]);

  return (
    <div className="app-container">
      <header>
        <div className="logo-section">
          <h2>Monkey AI Solver</h2>
          <div className="view-tabs">
            <button
              className={`tab-btn ${state.viewMode === "dashboard" ? "active" : ""}`}
              onClick={() => updateState("viewMode", "dashboard")}
            >
              🎮 Mô phỏng
            </button>
            <button
              className={`tab-btn ${state.viewMode === "tree" ? "active" : ""}`}
              onClick={() => updateState("viewMode", "tree")}
            >
              🌳 Cây trạng thái
            </button>
          </div>
        </div>

        {state.viewMode === "dashboard" && (
          <div className="controls">
            <button
              className={`btn ${state.isSelecting === "monkey" ? "active" : ""}`}
              onClick={() => updateState("isSelecting", "monkey")}
            >
              🐒 Khỉ
            </button>
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
            <select
              className="algo-select"
              value={state.selectedAlgo}
              onChange={(e) => updateState("selectedAlgo", e.target.value)}
              disabled={state.isSolving}
            >
              <option value="A*">A* Search</option>
              <option value="GREEDY">Greedy Best-First</option>
              <option value="BFS">BFS</option>
              <option value="DFS">DFS</option>
            </select>
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
        )}
      </header>

      <main className="main-layout">
        {state.viewMode === "dashboard" ? (
          <>
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
                      className={`cell ${["monkey", "stick", "box"].includes(state.isSelecting) ? "guide-active" : ""}`}
                      onClick={() => {
                        if (state.isSelecting === "monkey")
                          updateState("monkeyPos", p);
                        if (state.isSelecting === "stick")
                          updateState("stickPos", p);
                        if (state.isSelecting === "box")
                          updateState("boxPos", p);
                      }}
                    >
                      {state.boxPos === p && (
                        <div className="box-entity">🪑</div>
                      )}
                      {state.stickPos === p && !state.hasStick && (
                        <div
                          className="stick-entity"
                          style={{
                            bottom: state.boxPos === p ? "42px" : "8px",
                          }}
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
              <div className="sidebar-header">
                LỘ TRÌNH ({state.selectedAlgo})
              </div>
              <div className="steps-list">
                {state.steps.length === 0 && (
                  <p className="empty-msg">Thiết lập vị trí và nhấn Giải...</p>
                )}
                {state.steps.map((s, i) => (
                  <div
                    key={i}
                    className={`step-row ${i === state.currentStepIdx - 1 ? "active-row" : ""}`}
                  >
                    <span className="step-num">{i + 1}.</span>
                    <div className="step-content">
                      <div className="step-text">{s.action}</div>
                      <div className="cost-details">
                        <span className="cost-tag">f: {s.f}</span>{" "}
                        <span className="cost-tag">g: {s.g}</span>{" "}
                        <span className="cost-tag">h: {s.h}</span>
                      </div>
                    </div>
                    {i === state.currentStepIdx - 1 && (
                      <span className="arrow-pointer">◀</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="stats-container">
                <div className="stats-header">THỐNG KÊ GIẢI THUẬT</div>
                <table className="stats-table">
                  <tbody>
                    <tr>
                      <td className="label-cell">Cấu hình ban đầu:</td>
                      <td className="value-cell">
                        {state.stats.initialConfig || "---"}
                      </td>
                    </tr>
                    <tr>
                      <td className="label-cell">Thuật toán sử dụng:</td>
                      <td className="value-cell">{state.selectedAlgo}</td>
                    </tr>
                    <tr>
                      <td className="label-cell">Số trạng thái đã duyệt:</td>
                      <td className="value-cell">{state.stats.totalStates}</td>
                    </tr>
                    <tr>
                      <td className="label-cell">Tổng chi phí (g):</td>
                      <td className="value-cell">{state.stats.finalCost}</td>
                    </tr>
                    <tr>
                      <td className="label-cell">Kết quả:</td>
                      <td className="value-cell">
                        {state.isEaten ? "ĐÃ ĂN CHUỐI" : "---"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </aside>
          </>
        ) : (
          <section className="tree-container-graph">
            <div className="tree-header">
              <span>🌳 Đồ Thị Trạng Thái (Graph View)</span>

              {/* PHẦN CHÚ THÍCH MỚI */}
              <div className="tree-legend">
                <div className="legend-item">
                  <span className="dot root"></span> Gốc
                </div>
                <div className="legend-item">
                  <span className="dot explored"></span> Đã duyệt
                </div>
                <div className="legend-item">
                  <span className="dot goal"></span> Đích (Chuối)
                </div>
                <div className="legend-item">
                  <span className="dot pending"></span> Nhánh cụt/Chờ
                </div>
              </div>
            </div>
            <div className="tree-visualizer-d3" id="treeWrapper">
              {state.fullTreeData ? (
                <Tree
                  data={state.fullTreeData}
                  orientation="horizontal" // Tỏa ra bên phải
                  translate={{ x: 100, y: 200 }} // Vị trí gốc
                  nodeSize={{ x: 200, y: 50 }} // Khoảng cách giữa các node
                  renderCustomNodeElement={renderCustomNode} // Dùng node tự định nghĩa
                  pathFunc="diagonal" // Đường nối cong (hoặc dùng 'straight' cho mũi tên thẳng)
                  separation={{ siblings: 1, nonSiblings: 1.5 }}
                />
              ) : (
                <p className="empty-msg">
                  Chưa có dữ liệu. Hãy chạy giải thuật ở tab Mô phỏng.
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
