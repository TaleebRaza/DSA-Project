import { useState, useEffect, useRef, ReactNode } from "react";
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  ArrowRight,
  Layers,
  List,
  Zap,
  Terminal,
  Settings,
  Database,
  Activity,
} from "lucide-react";

// --- Types & Interfaces ---

interface Item {
  id: number;
  value: number;
  color: string;
}

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: "info" | "success" | "error";
}

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
}

interface CardProps {
  title: string;
  icon: React.ElementType;
  description: string;
  onClick: () => void;
}

type ViewState = "home" | "stack" | "queue";
type HighlightState = "overflow" | "underflow" | "insert" | "remove" | null;

// --- Components ---

const Button = ({
  onClick,
  disabled,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) => {
  const baseStyle =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

  const variants = {
    primary:
      "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]",
    secondary:
      "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600",
    danger:
      "bg-red-500 hover:bg-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]",
    ghost: "bg-transparent hover:bg-white/10 text-slate-300",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ title, icon: Icon, description, onClick }: CardProps) => (
  <div
    onClick={onClick}
    className="group relative bg-slate-800/50 backdrop-blur-md border border-slate-700 hover:border-cyan-500/50 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:-translate-y-1"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative z-10 flex flex-col items-center text-center gap-4">
      <div className="p-4 bg-slate-800 rounded-full group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-colors">
        <Icon size={48} />
      </div>
      <h3 className="text-2xl font-bold text-white">{title}</h3>
      <p className="text-slate-400">{description}</p>
      <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
        INITIALIZE <ArrowRight size={16} />
      </div>
    </div>
  </div>
);

// --- Main Application ---

export default function App() {
  const [view, setView] = useState<ViewState>("home");
  const [items, setItems] = useState<Item[]>([]);
  const [maxSize, setMaxSize] = useState<number>(8);
  const [inputValue, setInputValue] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [highlightLine, setHighlightLine] = useState<HighlightState>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Idle");

  // Refs for auto-scroll and interval
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-emerald-500",
    "bg-rose-500",
  ];

  // --- Helpers ---

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const addLog = (
    message: string,
    type: "info" | "success" | "error" = "info"
  ) => {
    const timestamp = new Date().toLocaleTimeString().split(" ")[0];
    setLogs((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), time: timestamp, message, type },
    ]);
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const generateRandomColor = () =>
    colors[Math.floor(Math.random() * colors.length)];

  // --- Core Logic with Animations ---

  const handlePushEnqueue = async (val: number | null = null) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const operationName = view === "stack" ? "PUSH" : "ENQUEUE";

    // Step 1: Check Overflow
    setStatusMessage(`Checking ${view.toUpperCase()} Overflow...`);
    setHighlightLine("overflow");
    await wait(600);

    if (items.length >= maxSize) {
      addLog(
        `Error: ${operationName} Failed. Overflow condition met (SIZE == MAX).`,
        "error"
      );
      setStatusMessage("Overflow Error!");
      setHighlightLine("overflow"); // Keep highlighted
      setIsProcessing(false);
      return;
    }

    // Step 2: Prepare Value
    const valueToAdd =
      val !== null
        ? val
        : inputValue
        ? parseInt(inputValue)
        : Math.floor(Math.random() * 100);
    const newItem: Item = {
      id: Date.now() + Math.random(),
      value: valueToAdd,
      color: generateRandomColor(),
    };

    // Step 3: Execute Operation Logic
    setStatusMessage("Incrementing Pointer & Inserting Value...");
    setHighlightLine("insert");

    if (view === "stack") {
      // Animate "Top" moving (Simulated by adding item)
      setItems((prev) => [...prev, newItem]);
      addLog(`PUSH(${valueToAdd}) -> STACK[${items.length}]`, "success");
    } else {
      setItems((prev) => [...prev, newItem]);
      addLog(`ENQUEUE(${valueToAdd}) -> QUEUE[${items.length}]`, "success");
    }

    await wait(500);
    setInputValue("");
    setStatusMessage("Idle");
    setHighlightLine(null);
    setIsProcessing(false);
  };

  const handlePopDequeue = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const operationName = view === "stack" ? "POP" : "DEQUEUE";

    // Step 1: Check Underflow
    setStatusMessage(`Checking ${view.toUpperCase()} Underflow...`);
    setHighlightLine("underflow");
    await wait(600);

    if (items.length === 0) {
      addLog(
        `Error: ${operationName} Failed. Underflow condition met (SIZE == 0).`,
        "error"
      );
      setStatusMessage("Underflow Error!");
      setIsPlaying(false); // Stop auto-play on error
      setIsProcessing(false);
      return;
    }

    // Step 2: Execute Removal
    setStatusMessage(
      view === "stack"
        ? "Decrementing Top Pointer..."
        : "Shifting Front Pointer..."
    );
    setHighlightLine("remove");

    if (view === "stack") {
      const itemToRemove = items[items.length - 1];
      setItems((prev) => prev.slice(0, -1)); // Visual removal
      addLog(`POP() -> Removed ${itemToRemove.value}`, "success");
    } else {
      const itemToRemove = items[0];
      setItems((prev) => prev.slice(1));
      addLog(`DEQUEUE() -> Removed ${itemToRemove.value}`, "success");
    }

    await wait(500);
    setStatusMessage("Idle");
    setHighlightLine(null);
    setIsProcessing(false);
  };

  const generateRandomSet = () => {
    if (isProcessing) return;
    const count = Math.floor(Math.random() * (maxSize / 2)) + 3;
    const newItems = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i,
      value: Math.floor(Math.random() * 100),
      color: colors[i % colors.length],
    }));
    setItems(newItems);
    addLog(`System: Generated ${count} random integers.`);
    setHighlightLine(null);
  };

  const reset = () => {
    setItems([]);
    setLogs([]);
    setIsPlaying(false);
    setIsProcessing(false);
    setHighlightLine(null);
    setStatusMessage("Idle");
    addLog("System: Memory cleared.");
  };

  // --- Automation Loop ---

  useEffect(() => {
    if (isPlaying && !isProcessing) {
      intervalRef.current = setInterval(() => {
        // We need to check items.length, but inside setInterval closures can be tricky.
        // Using a functional update pattern in handlePopDequeue or checking via ref is safer,
        // but since items is a dependency of useEffect, the interval is recreated on change.
        if (items.length > 0) {
          handlePopDequeue();
        } else {
          setIsPlaying(false);
          addLog("System: Auto-process complete.", "info");
        }
      }, 1500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, isProcessing, items]);

  // --- Render Views ---

  if (view === "home") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-cyan-500/30 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative z-10 max-w-4xl w-full space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
              DSA<span className="text-white">.IO</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Interactive memory allocation visualizer. Select a data structure
              architecture to begin simulation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card
              title="LIFO STACK"
              icon={Layers}
              description="Last In, First Out. Operations occur at the Top pointer."
              onClick={() => {
                setView("stack");
                addLog("System: Stack architecture initialized.");
              }}
            />
            <Card
              title="FIFO QUEUE"
              icon={List}
              description="First In, First Out. Operations involve Front and Rear pointers."
              onClick={() => {
                setView("queue");
                addLog("System: Queue architecture initialized.");
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Calculate Pointer Values for Display
  const topVal =
    view === "stack" ? (items.length > 0 ? items.length - 1 : -1) : null;
  const rearVal =
    view === "queue" ? (items.length > 0 ? items.length - 1 : -1) : null;
  const frontVal = view === "queue" ? (items.length > 0 ? 0 : -1) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar / Configuration */}
      <div className="w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col h-[50vh] md:h-screen z-20 shadow-xl shrink-0">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {view === "stack" ? (
              <Layers className="text-purple-400" />
            ) : (
              <List className="text-cyan-400" />
            )}
            {view.toUpperCase()}
          </h2>
          <button
            onClick={() => {
              setView("home");
              reset();
            }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Status Monitor */}
          <div className="bg-black/40 rounded-lg p-3 border border-slate-700/50">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity size={12} /> Live Monitor
            </div>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">STATUS:</span>
                <span
                  className={
                    isProcessing
                      ? "text-yellow-400 animate-pulse"
                      : "text-green-400"
                  }
                >
                  {statusMessage}
                </span>
              </div>
              {view === "stack" ? (
                <div className="flex justify-between">
                  <span className="text-slate-400">TOP POINTER:</span>
                  <span className="text-cyan-400">{topVal}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">FRONT POINTER:</span>
                    <span className="text-cyan-400">{frontVal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">REAR POINTER:</span>
                    <span className="text-purple-400">{rearVal}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">SIZE:</span>
                <span
                  className={
                    items.length === maxSize ? "text-red-400" : "text-white"
                  }
                >
                  {items.length} / {maxSize}
                </span>
              </div>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
              <Settings size={14} /> Configuration
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Max Capacity (Size)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="4"
                    max="12"
                    value={maxSize}
                    onChange={(e) => {
                      if (!isProcessing) setMaxSize(Number(e.target.value));
                    }}
                    disabled={isProcessing}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50"
                  />
                  <span className="font-mono text-cyan-400">{maxSize}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
              <Database size={14} /> I/O Operations
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Val"
                  disabled={isProcessing || isPlaying}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-50"
                />
                <Button
                  onClick={() => handlePushEnqueue()}
                  disabled={isProcessing || isPlaying}
                >
                  {view === "stack" ? "Push" : "Enq"}
                </Button>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => generateRandomSet()}
                disabled={isProcessing || isPlaying}
              >
                <Zap size={16} /> Random Fill
              </Button>

              <div className="h-px bg-slate-700 my-4" />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={isPlaying ? "danger" : "primary"}
                  className="w-full col-span-2"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={isProcessing && !isPlaying} // Can always stop, but can't start if busy
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  {isPlaying ? "Stop Auto" : "Auto Play"}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => handlePopDequeue()}
                  disabled={isProcessing || isPlaying}
                >
                  <StepForward size={18} /> Step
                </Button>
                <Button
                  variant="secondary"
                  onClick={reset}
                  disabled={isProcessing || isPlaying}
                >
                  <RotateCcw size={18} /> Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Pseudocode Section */}
          <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs border border-slate-700 overflow-hidden shadow-inner">
            <div className="text-slate-500 mb-2 border-b border-slate-800 pb-1 flex justify-between">
              <span>ALGORITHM TRACE</span>
              {highlightLine && (
                <span className="text-cyan-500 animate-pulse">
                  EXECUTING...
                </span>
              )}
            </div>
            <div
              className={`transition-all duration-300 p-1 rounded ${
                highlightLine === "overflow"
                  ? "bg-red-500/20 text-red-200 font-bold border-l-2 border-red-500 pl-2"
                  : "text-slate-500"
              }`}
            >
              1. IF (SIZE == MAX) RETURN OVERFLOW
            </div>
            <div
              className={`transition-all duration-300 p-1 rounded ${
                highlightLine === "underflow"
                  ? "bg-red-500/20 text-red-200 font-bold border-l-2 border-red-500 pl-2"
                  : "text-slate-500"
              }`}
            >
              2. IF (SIZE == 0) RETURN UNDERFLOW
            </div>
            <div
              className={`transition-all duration-300 p-1 rounded ${
                highlightLine === "insert"
                  ? "bg-cyan-500/20 text-cyan-200 font-bold border-l-2 border-cyan-500 pl-2"
                  : "text-slate-400"
              }`}
            >
              3.{" "}
              {view === "stack"
                ? "TOP++; STACK[TOP] = VAL"
                : "REAR++; QUEUE[REAR] = VAL"}
            </div>
            <div
              className={`transition-all duration-300 p-1 rounded ${
                highlightLine === "remove"
                  ? "bg-purple-500/20 text-purple-200 font-bold border-l-2 border-purple-500 pl-2"
                  : "text-slate-400"
              }`}
            >
              4.{" "}
              {view === "stack"
                ? "VAL = STACK[TOP]; TOP--"
                : "VAL = QUEUE[FRONT]; FRONT++"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Visualization Area */}
      <div className="flex-1 bg-slate-900 relative flex flex-col min-h-[500px]">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-50 pointer-events-none" />

        {/* Visualizer Container - Removed overflow-hidden to allow pointers to be seen */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {/* STACK VISUALIZATION */}
          {view === "stack" && (
            <div className="relative">
              {/* Empty Slot Skeleton */}
              <div
                className="border-x-4 border-b-4 border-slate-700/50 bg-slate-800/20 rounded-b-xl relative"
                style={{ width: "220px", height: `${maxSize * 50 + 20}px` }}
              >
                {/* Memory Address Grid Background */}
                <div className="absolute inset-0 flex flex-col-reverse p-2 gap-1 pointer-events-none">
                  {Array.from({ length: maxSize }).map((_, i) => (
                    <div
                      key={`slot-${i}`}
                      className="w-full h-[46px] border border-dashed border-slate-700/30 rounded flex items-center justify-center text-[10px] text-slate-600 font-mono"
                    >
                      ADDR: 0x
                      {((i + 1) * 4)
                        .toString(16)
                        .toUpperCase()
                        .padStart(2, "0")}
                    </div>
                  ))}
                </div>

                {/* Actual Items */}
                <div className="absolute inset-0 flex flex-col-reverse justify-start p-2 gap-1 z-10">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`${item.color} h-[46px] w-full rounded shadow-[0_0_15px_rgba(0,0,0,0.3)] flex items-center justify-between px-4 text-white font-bold font-mono animate-in slide-in-from-top-4 fade-in duration-300`}
                    >
                      <span>{item.value}</span>
                      <span className="text-[10px] opacity-75 bg-black/20 px-1 rounded">
                        IDX:{index}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dynamic Pointers */}
                <div
                  className="absolute right-0 transition-all duration-500 ease-out"
                  style={{
                    bottom: `${(items.length > 0 ? items.length : 0) * 50}px`,
                  }}
                >
                  <div className="relative">
                    <div className="absolute right-[-140px] top-[-35px] flex items-center text-cyan-400 font-mono text-sm font-bold bg-slate-900/80 px-2 py-1 rounded border border-cyan-500/30">
                      <ArrowRight className="rotate-180 mr-2" /> TOP: {topVal}
                    </div>
                  </div>
                </div>

                <div className="absolute -left-24 bottom-2 text-xs font-mono text-slate-500">
                  BASE (0)
                </div>
              </div>
            </div>
          )}

          {/* QUEUE VISUALIZATION */}
          {view === "queue" && (
            <div className="relative w-full max-w-4xl overflow-x-auto flex justify-center py-24">
              {/* Queue Container */}
              <div className="relative flex items-center justify-center">
                {/* Fixed Memory Slots - Pointers moved INSIDE this container */}
                <div className="flex gap-2 p-4 border-t-2 border-b-2 border-slate-700/50 bg-slate-800/20 backdrop-blur-sm rounded-lg relative min-w-[300px] justify-center">
                  {/* Empty Slots Phantom */}
                  {Array.from({ length: maxSize }).map((_, i) => (
                    <div
                      key={`qslot-${i}`}
                      className="w-16 h-16 border border-dashed border-slate-700/30 rounded flex items-center justify-center text-[10px] text-slate-700 font-mono shrink-0"
                    >
                      {i}
                    </div>
                  ))}

                  {/* Actual Items Overlay */}
                  <div className="absolute inset-0 flex items-center px-4 gap-2 z-10 pointer-events-none">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`${item.color} w-16 h-16 shrink-0 rounded shadow-lg flex flex-col items-center justify-center text-white font-bold font-mono animate-in slide-in-from-right-8 fade-in duration-300`}
                      >
                        <span className="text-lg">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* FRONT POINTER */}
                  <div
                    className="absolute top-[-50px] transition-all duration-500 ease-out flex flex-col items-center z-20"
                    style={{ left: `${48}px`, transform: "translateX(-50%)" }}
                  >
                    <div className="text-cyan-400 font-bold font-mono text-xs mb-1">
                      FRONT
                    </div>
                    <div className="w-0.5 h-8 bg-cyan-400/50"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  </div>

                  {/* REAR POINTER */}
                  <div
                    className="absolute bottom-[-50px] transition-all duration-500 ease-out flex flex-col-reverse items-center z-20"
                    style={{
                      left: `${
                        48 + (items.length > 0 ? items.length - 1 : 0) * 72
                      }px`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="text-purple-400 font-bold font-mono text-xs mt-1">
                      REAR
                    </div>
                    <div className="w-0.5 h-8 bg-purple-400/50"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logger / Terminal */}
        <div className="h-48 bg-black/80 border-t border-slate-700 p-4 font-mono text-sm overflow-y-auto z-20">
          <div className="flex items-center gap-2 text-slate-500 mb-2 sticky top-0 bg-black/80 backdrop-blur-sm w-full py-1">
            <Terminal size={14} /> SYSTEM LOGS
          </div>
          <div className="space-y-1">
            {logs.length === 0 && (
              <span className="text-slate-600 italic">Ready for input...</span>
            )}
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300"
              >
                <span className="text-slate-600 shrink-0">[{log.time}]</span>
                <span
                  className={`${
                    log.type === "error"
                      ? "text-red-400"
                      : log.type === "success"
                      ? "text-green-400"
                      : "text-cyan-300"
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
