import { useState, useEffect, useRef, ReactNode } from 'react';
import { Play, Pause, StepForward, RotateCcw, ArrowRight, Layers, List, Zap, Terminal, Settings, Database, Activity, RefreshCw, ArrowUp, Star, ArrowDown } from 'lucide-react';

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
  type: 'info' | 'success' | 'error';
}

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
}

interface CardProps {
  title: string;
  icon: React.ElementType;
  description: string;
  onClick: () => void;
}

type ViewState = 'home' | 'stack' | 'linear-queue' | 'circular-queue' | 'priority-queue';
type HighlightState = 'overflow' | 'underflow' | 'insert' | 'remove' | 'compare' | null;
type PriorityMode = 'max' | 'min';

// --- Components ---

const Button = ({ onClick, disabled, children, variant = 'primary', className = '' }: ButtonProps) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    primary: "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600",
    danger: "bg-red-500 hover:bg-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]",
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
    className="group relative bg-slate-800/50 backdrop-blur-md border border-slate-700 hover:border-cyan-500/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:-translate-y-1 h-full flex flex-col"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative z-10 flex flex-col items-center text-center gap-4 flex-1">
      <div className="p-4 bg-slate-800 rounded-full group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-colors">
        <Icon size={40} />
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
      <div className="mt-auto pt-4 flex items-center gap-2 text-cyan-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
        INITIALIZE <ArrowRight size={14} />
      </div>
    </div>
  </div>
);

// --- Main Application ---

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [items, setItems] = useState<(Item | null)[]>([]);
  const [maxSize, setMaxSize] = useState<number>(8);
  const [inputValue, setInputValue] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [highlightLine, setHighlightLine] = useState<HighlightState>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Idle');
  const [priorityMode, setPriorityMode] = useState<PriorityMode>('max');

  const [pointers, setPointers] = useState({ front: -1, rear: -1 });
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 
    'bg-teal-500', 'bg-orange-500', 'bg-emerald-500', 'bg-rose-500'
  ];

  // --- Helpers ---

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString().split(' ')[0];
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), time: timestamp, message, type }]);
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Init Arrays based on View
  useEffect(() => {
    if (view === 'circular-queue' || view === 'linear-queue') {
      setItems(new Array(maxSize).fill(null));
      setPointers({ front: -1, rear: -1 });
    } else {
      setItems([]);
    }
  }, [view, maxSize]);

  const generateRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

  // --- Core Logic ---

  const handlePushEnqueue = async (val: number | null = null) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const valueToAdd = val !== null ? val : (inputValue ? parseInt(inputValue) : Math.floor(Math.random() * 100));
    const newItem: Item = {
      id: Date.now() + Math.random(),
      value: valueToAdd,
      color: generateRandomColor()
    };

    setStatusMessage('Checking Overflow...');
    setHighlightLine('overflow');
    await wait(500);

    // --- LINEAR QUEUE LOGIC ---
    if (view === 'linear-queue') {
       const { front, rear } = pointers;
       
       if (rear === maxSize - 1) {
           addLog('Error: Linear Queue Overflow (Rear reached Max)', 'error');
           setStatusMessage('Overflow Error!');
           setIsProcessing(false);
           return;
       }

       setStatusMessage('Inserting at Rear...');
       setHighlightLine('insert');
       
       let newFront = front;
       let newRear = rear;

       if (front === -1) {
           newFront = 0;
           newRear = 0;
           addLog('Queue Init: Set FRONT=0, REAR=0');
       } else {
           newRear = rear + 1;
           addLog(`Increment REAR to ${newRear}`);
       }

       await wait(500);
       setPointers({ front: newFront, rear: newRear });
       setItems(prev => {
           const copy = [...prev];
           copy[newRear] = newItem;
           return copy;
       });
       addLog(`Inserted ${valueToAdd} at Index ${newRear}`, 'success');
    }

    // --- CIRCULAR QUEUE LOGIC ---
    else if (view === 'circular-queue') {
        const { front, rear } = pointers;
        if ((rear + 1) % maxSize === front) {
            addLog('Error: Circular Queue is Full!', 'error');
            setStatusMessage('Overflow Error!');
            setIsProcessing(false);
            return;
        }

        setStatusMessage('Calculating Position...');
        setHighlightLine('insert');
        
        let newFront = front;
        let newRear = rear;

        if (front === -1) {
            newFront = 0;
            newRear = 0;
            addLog(`First Element: Set FRONT=0, REAR=0`);
        } else {
            newRear = (rear + 1) % maxSize;
            addLog(`Next Pos: (REAR + 1) % MAX = ${newRear}`);
        }

        await wait(500);
        
        setPointers({ front: newFront, rear: newRear });
        setItems(prev => {
            const copy = [...prev];
            copy[newRear] = newItem;
            return copy;
        });
        addLog(`Inserted ${valueToAdd} at Index ${newRear}`, 'success');
    }
    
    // --- PRIORITY QUEUE LOGIC ---
    else if (view === 'priority-queue') {
        const activeItems = items as Item[];
        if (activeItems.length >= maxSize) {
            addLog('Error: Priority Queue Overflow', 'error');
            setIsProcessing(false);
            return;
        }

        setHighlightLine('compare');
        setStatusMessage(priorityMode === 'max' ? 'Scanning for Max Priority...' : 'Scanning for Min Priority...');
        
        let insertIndex = activeItems.length;
        for (let i = 0; i < activeItems.length; i++) {
             await wait(200);
             // Logic Toggle: Max (>) or Min (<)
             const shouldInsert = priorityMode === 'max' 
                ? valueToAdd > activeItems[i].value 
                : valueToAdd < activeItems[i].value;

             if (shouldInsert) {
                 insertIndex = i;
                 break;
             }
        }

        setHighlightLine('insert');
        setStatusMessage(`Inserting at Index ${insertIndex}...`);
        await wait(300);

        setItems(prev => {
            const copy = [...(prev as Item[])];
            copy.splice(insertIndex, 0, newItem);
            return copy;
        });
        addLog(`Inserted ${valueToAdd} (Priority) at index ${insertIndex}`, 'success');
    }

    // --- STACK LOGIC ---
    else {
        const activeItems = items as Item[];
        if (activeItems.length >= maxSize) {
            addLog('Error: Stack Overflow', 'error');
            setIsProcessing(false);
            return;
        }

        setHighlightLine('insert');
        setStatusMessage('Pushing to Top...');
        setItems(prev => [...(prev as Item[]), newItem]);
        addLog(`PUSH(${valueToAdd}) -> Top`, 'success');
    }

    await wait(400);
    setInputValue('');
    setStatusMessage('Idle');
    setHighlightLine(null);
    setIsProcessing(false);
  };

  const handlePopDequeue = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    setStatusMessage('Checking Underflow...');
    setHighlightLine('underflow');
    await wait(500);

    // --- LINEAR QUEUE LOGIC ---
    if (view === 'linear-queue') {
        const { front, rear } = pointers;
        
        if (front === -1 || front > rear) {
             addLog('Error: Linear Queue Underflow', 'error');
             setIsPlaying(false);
             setIsProcessing(false);
             return;
        }

        setHighlightLine('remove');
        setStatusMessage('Removing from Front...');
        const removedItem = items[front];
        
        await wait(500);

        setItems(prev => {
            const copy = [...prev];
            copy[front] = null;
            return copy;
        });
        
        addLog(`Removed ${removedItem?.value} from Index ${front}`, 'success');
        
        const newFront = front + 1;
        
        if (newFront > rear) {
             setPointers({ front: newFront, rear: rear });
             addLog(`Queue is now effectively empty. Reset required to reuse space.`);
        } else {
             setPointers({ front: newFront, rear: rear });
        }
    }

    // --- CIRCULAR QUEUE LOGIC ---
    else if (view === 'circular-queue') {
        const { front, rear } = pointers;
        if (front === -1) {
            addLog('Error: Circular Queue Underflow', 'error');
            setIsPlaying(false);
            setIsProcessing(false);
            return;
        }

        setHighlightLine('remove');
        setStatusMessage('Removing from Front...');
        
        const removedItem = items[front];
        await wait(500);

        setItems(prev => {
            const copy = [...prev];
            copy[front] = null;
            return copy;
        });

        if (front === rear) {
            setPointers({ front: -1, rear: -1 });
            addLog('Queue Empty: Reset FRONT/REAR to -1');
        } else {
            const newFront = (front + 1) % maxSize;
            setPointers(prev => ({ ...prev, front: newFront }));
            addLog(`Updated FRONT: (FRONT + 1) % MAX = ${newFront}`);
        }
        
        if(removedItem) addLog(`Removed ${removedItem.value}`, 'success');
    }

    // --- STACK & PRIORITY LOGIC ---
    else {
        const activeItems = items as Item[];
        if (activeItems.length === 0) {
            addLog('Error: Underflow', 'error');
            setIsPlaying(false);
            setIsProcessing(false);
            return;
        }

        setHighlightLine('remove');
        
        if (view === 'stack') {
            setStatusMessage('Popping Top...');
            const removed = activeItems[activeItems.length - 1];
            await wait(300);
            setItems(prev => (prev as Item[]).slice(0, -1));
            addLog(`POP: Removed ${removed.value}`, 'success');
        } else {
            setStatusMessage('Dequeuing Front...');
            const removed = activeItems[0];
            await wait(300);
            setItems(prev => (prev as Item[]).slice(1));
            addLog(`DEQUEUE: Removed ${removed.value}`, 'success');
        }
    }

    await wait(400);
    setStatusMessage('Idle');
    setHighlightLine(null);
    setIsProcessing(false);
  };

  const generateRandomSet = () => {
    if (isProcessing) return;

    const count = Math.floor(Math.random() * (maxSize - 2)) + 2;

    if (view === 'linear-queue') {
         const newItems = new Array(maxSize).fill(null);
         for(let i=0; i < count; i++) {
             newItems[i] = {
                 id: Date.now() + i,
                 value: Math.floor(Math.random() * 100),
                 color: colors[i % colors.length]
             };
         }
         setItems(newItems);
         setPointers({ front: 0, rear: count - 1 });
         addLog(`System: Randomly filled ${count} items (Linear).`);
         
    } else if (view === 'circular-queue') {
         const newItems = new Array(maxSize).fill(null);
         const startIdx = Math.floor(Math.random() * maxSize);
         for(let i=0; i < count; i++) {
             const idx = (startIdx + i) % maxSize;
             newItems[idx] = {
                 id: Date.now() + i,
                 value: Math.floor(Math.random() * 100),
                 color: colors[i % colors.length]
             };
         }
         setItems(newItems);
         const endIdx = (startIdx + count - 1) % maxSize;
         setPointers({ front: startIdx, rear: endIdx });
         addLog(`System: Randomly filled ${count} items (Circular start at ${startIdx}).`);

    } else {
        const newItems = Array.from({ length: count }).map((_, i) => ({
          id: Date.now() + i,
          value: Math.floor(Math.random() * 100),
          color: colors[i % colors.length]
        }));
        
        if (view === 'priority-queue') {
            newItems.sort((a, b) => priorityMode === 'max' ? b.value - a.value : a.value - b.value);
        }
    
        setItems(newItems);
        addLog(`System: Generated ${count} random integers.`);
    }
  };

  const reset = () => {
    if (view === 'circular-queue' || view === 'linear-queue') {
        setItems(new Array(maxSize).fill(null));
        setPointers({ front: -1, rear: -1 });
    } else {
        setItems([]);
    }
    setLogs([]);
    setIsPlaying(false);
    setIsProcessing(false);
    setStatusMessage('Idle');
    addLog('System: Memory cleared.');
  };

  // --- Automation Loop ---

  useEffect(() => {
    if (isPlaying && !isProcessing) {
      intervalRef.current = setInterval(() => {
        let hasItems = false;
        if (view === 'circular-queue') {
            hasItems = pointers.front !== -1;
        } else if (view === 'linear-queue') {
            hasItems = pointers.front !== -1 && pointers.front <= pointers.rear;
        } else {
            hasItems = (items as Item[]).length > 0;
        }

        if (hasItems) {
           handlePopDequeue();
        } else {
          setIsPlaying(false);
          addLog('System: Auto-process complete.', 'info');
        }
      }, 2000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, isProcessing, items, pointers, view, priorityMode]);


  // --- Render Views ---

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-cyan-500/30 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="relative z-10 max-w-5xl w-full space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
              STRUCT<span className="text-white">.IO</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Select a Data Structure Architecture
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              title="STACK" 
              icon={Layers} 
              description="LIFO (Last In First Out). Push/Pop from Top."
              onClick={() => { setView('stack'); addLog('Initialized Stack'); }}
            />
            <Card 
              title="LINEAR QUEUE" 
              icon={List} 
              description="FIFO (First In First Out). Fixed Buffer Limitation."
              onClick={() => { setView('linear-queue'); addLog('Initialized Linear Queue'); }}
            />
             <Card 
              title="CIRCULAR QUEUE" 
              icon={RefreshCw} 
              description="Ring Buffer. Connects end back to start."
              onClick={() => { setView('circular-queue'); addLog('Initialized Circular Queue'); }}
            />
             <Card 
              title="PRIORITY QUEUE" 
              icon={Star} 
              description="Sorted Insert. Higher value = Higher Priority."
              onClick={() => { setView('priority-queue'); addLog('Initialized Priority Queue'); }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-80 bg-slate-800 border-r border-slate-700 flex flex-col h-[40vh] md:h-screen z-20 shadow-xl shrink-0">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2 uppercase">
            {view === 'stack' && <Layers className="text-purple-400" />}
            {view === 'linear-queue' && <List className="text-cyan-400" />}
            {view === 'circular-queue' && <RefreshCw className="text-green-400" />}
            {view === 'priority-queue' && <Star className="text-yellow-400" />}
            {view.replace('-', ' ')}
          </h2>
          <button onClick={() => { setView('home'); reset(); }} className="text-slate-400 hover:text-white transition-colors">
            <RotateCcw size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {/* Status */}
           <div className="bg-black/40 rounded-lg p-3 border border-slate-700/50">
             <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Activity size={12} /> Monitor
             </div>
             <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                   <span className="text-slate-400">STATUS:</span>
                   <span className={isProcessing ? "text-yellow-400" : "text-green-400"}>{statusMessage}</span>
                </div>
                {(view === 'circular-queue' || view === 'linear-queue') && (
                    <>
                    <div className="flex justify-between">
                        <span className="text-slate-400">FRONT IDX:</span>
                        <span className="text-cyan-400">{pointers.front}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">REAR IDX:</span>
                        <span className="text-purple-400">{pointers.rear}</span>
                    </div>
                    </>
                )}
             </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                  <Settings size={14} /> Config
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                  {/* Size Slider */}
                  <div>
                      <label className="text-xs text-slate-500 mb-1 block flex justify-between">
                          <span>Max Capacity</span>
                          <span className="text-cyan-400 font-mono">{maxSize}</span>
                      </label>
                      <input
                          type="range"
                          min="4"
                          max="16"
                          value={maxSize}
                          onChange={(e) => {
                              const newSize = Number(e.target.value);
                              setMaxSize(newSize);
                              // Reset Logic
                              if (view === 'circular-queue' || view === 'linear-queue') {
                                   setItems(new Array(newSize).fill(null));
                                   setPointers({ front: -1, rear: -1 });
                              } else {
                                   setItems([]);
                              }
                              setLogs([]);
                              addLog(`System: Capacity resized to ${newSize}. Memory cleared.`);
                          }}
                          disabled={isProcessing || isPlaying}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50"
                      />
                  </div>

                  {/* Priority Toggle */}
                  {view === 'priority-queue' && (
                      <div>
                          <label className="text-xs text-slate-500 mb-2 block">Priority Logic</label>
                          <div className="flex bg-slate-800 p-1 rounded-lg">
                              <button
                                  onClick={() => { setPriorityMode('max'); reset(); }}
                                  className={`flex-1 py-1 text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors ${priorityMode === 'max' ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                              >
                                  Max <ArrowUp size={12} />
                              </button>
                              <button
                                  onClick={() => { setPriorityMode('min'); reset(); }}
                                  className={`flex-1 py-1 text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors ${priorityMode === 'min' ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                              >
                                  Min <ArrowDown size={12} />
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                  <Database size={14} /> Actions
             </div>
             <div className="flex gap-2">
                 <input 
                   type="number" 
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                   placeholder={view === 'priority-queue' ? "Priority Val" : "Value"}
                   disabled={isProcessing || isPlaying}
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-50"
                 />
                 <Button onClick={() => handlePushEnqueue()} disabled={isProcessing || isPlaying}>
                   {view === 'stack' ? 'Push' : 'Enq'}
                 </Button>
               </div>
               
               <div className="grid grid-cols-2 gap-2">
                 <Button 
                    variant={isPlaying ? "danger" : "primary"} 
                    className="col-span-2"
                    onClick={() => setIsPlaying(!isPlaying)}
                    disabled={isProcessing && !isPlaying}
                 >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    {isPlaying ? 'Stop' : 'Auto'}
                 </Button>
                 <Button variant="secondary" onClick={() => handlePopDequeue()} disabled={isProcessing || isPlaying}>
                    <StepForward size={18} /> Step
                 </Button>
                 <Button variant="secondary" className="w-full" onClick={() => generateRandomSet()} disabled={isProcessing || isPlaying}>
                    <Zap size={16} /> Random Fill
                 </Button>
                 <Button variant="secondary" onClick={reset} disabled={isProcessing || isPlaying}>
                    <RotateCcw size={18} /> Reset
                 </Button>
               </div>
          </div>

          {/* Logic Display */}
          <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] border border-slate-700">
             <div className="text-slate-500 mb-2 border-b border-slate-800 pb-1">ALGORITHM</div>
             <div className={`${highlightLine === 'overflow' ? 'text-red-300 font-bold' : 'text-slate-600'}`}>
                1. CHECK OVERFLOW
             </div>
             <div className={`${highlightLine === 'underflow' ? 'text-red-300 font-bold' : 'text-slate-600'}`}>
                2. CHECK UNDERFLOW
             </div>
             {view === 'priority-queue' && (
                 <div className={`${highlightLine === 'compare' ? 'text-yellow-300 font-bold' : 'text-slate-600'}`}>
                    3. SCAN FOR {priorityMode === 'max' ? 'MAX' : 'MIN'} PRIORITY
                 </div>
             )}
             <div className={`${highlightLine === 'insert' ? 'text-cyan-300 font-bold' : 'text-slate-600'}`}>
                {view === 'priority-queue' ? '4.' : '3.'} INSERT / UPDATE PTR
             </div>
             <div className={`${highlightLine === 'remove' ? 'text-purple-300 font-bold' : 'text-slate-600'}`}>
                {view === 'priority-queue' ? '5.' : '4.'} REMOVE / UPDATE PTR
             </div>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 bg-slate-900 relative flex flex-col min-h-[500px]">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-50 pointer-events-none" />
         
         <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
            
            {/* STACK */}
            {view === 'stack' && (
               <div className="relative">
                  <div className="border-x-4 border-b-4 border-slate-700/50 bg-slate-800/20 rounded-b-xl relative flex flex-col-reverse p-2 gap-1 w-56 transition-all duration-300" style={{ height: `${maxSize * 50}px` }}>
                     {(items as Item[]).map((item, index) => (
                       <div key={item.id} className={`${item.color} h-10 w-full rounded flex items-center justify-between px-4 text-white font-bold animate-in slide-in-from-top-4`}>
                          <span>{item.value}</span><span className="text-[10px] opacity-70">IDX:{index}</span>
                       </div>
                     ))}
                  </div>
                  <div className="absolute right-[-100px] transition-all duration-300" style={{ bottom: `${(items.length) * 44}px` }}>
                       <div className="flex items-center text-cyan-400 font-mono text-xs font-bold"><ArrowRight className="rotate-180 mr-2"/> TOP</div>
                  </div>
               </div>
            )}

            {/* LINEAR QUEUE */}
            {view === 'linear-queue' && (
              <div className="relative pt-12 pb-12 w-full overflow-x-auto flex justify-center">
                <div className="flex gap-2 p-4 border-y-2 border-slate-700/50 bg-slate-800/20 rounded-lg min-w-[300px] min-h-[100px] items-center justify-center">
                   {/* Render all fixed slots */}
                   {items.map((item, index) => {
                      // Logic for "Removed/Empty" slots before Front
                      const isRemoved = pointers.front !== -1 && index < pointers.front;
                      const isPointerFront = pointers.front === index;
                      const isPointerRear = pointers.rear === index;
                      
                      return (
                          <div 
                             key={index} 
                             className={`w-14 h-14 rounded flex flex-col items-center justify-center font-bold relative transition-all duration-300 shrink-0
                                ${item ? `${item.color} text-white` : isRemoved ? 'border-2 border-dashed border-red-500/50 bg-red-500/10' : 'border-2 border-dashed border-slate-700/30 bg-slate-800/30'}
                             `}
                          >
                              {item ? item.value : (isRemoved ? <span className="text-[8px] text-red-500 font-mono">REMOVED</span> : null)}
                              <span className="text-[8px] opacity-70 absolute top-1 right-1 text-slate-500">{index}</span>
                              
                              {/* Front Pointer */}
                              {isPointerFront && (
                                  <div className="absolute -top-12 flex flex-col items-center z-10 animate-in slide-in-from-bottom-2">
                                      <span className="text-cyan-400 text-[10px] font-bold font-mono mb-1">FRONT</span>
                                      <div className="w-0.5 h-4 bg-cyan-400/50"></div>
                                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                                  </div>
                              )}

                              {/* Rear Pointer */}
                              {isPointerRear && (
                                  <div className="absolute -bottom-12 flex flex-col-reverse items-center z-10 animate-in slide-in-from-top-2">
                                      <span className="text-purple-400 text-[10px] font-bold font-mono mt-1">REAR</span>
                                      <div className="w-0.5 h-4 bg-purple-400/50"></div>
                                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                                  </div>
                              )}
                          </div>
                      );
                   })}
                </div>
              </div>
            )}

            {/* PRIORITY QUEUE */}
            {view === 'priority-queue' && (
               <div className="w-full max-w-2xl">
                  <div className="text-center mb-4 text-slate-500 font-mono text-xs uppercase">
                      {priorityMode === 'max' ? 'Highest Value' : 'Lowest Value'} = Highest Priority (HEAD)
                  </div>
                  <div className="flex gap-2 p-4 border-2 border-dashed border-slate-700/50 bg-slate-800/20 rounded-lg min-h-[100px] items-center flex-wrap justify-center transition-all duration-500">
                    {(items as Item[]).length === 0 && <span className="text-slate-600 font-mono text-xs">EMPTY PRIORITY QUEUE</span>}
                    {(items as Item[]).map((item, index) => (
                        <div key={item.id} className={`${item.color} w-16 h-16 rounded-lg flex flex-col items-center justify-center text-white font-bold shadow-lg animate-in zoom-in duration-300 relative group`}>
                            {index === 0 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] px-1 rounded font-bold">HEAD</div>}
                            <span className="text-lg">{item.value}</span>
                            <span className="text-[9px] opacity-70 mt-1">P:{item.value}</span>
                        </div>
                    ))}
                  </div>
               </div>
            )}

            {/* CIRCULAR QUEUE (Ring Buffer Visual) */}
            {view === 'circular-queue' && (
                <div className="relative w-[400px] h-[400px] flex items-center justify-center">
                    {/* Central Info */}
                    <div className="absolute text-center z-10">
                        <div className="text-slate-500 text-xs font-mono">RING BUFFER</div>
                        <div className="text-slate-700 text-[10px]">SIZE: {maxSize}</div>
                    </div>

                    {/* Ring Slots */}
                    {items.map((item, i) => {
                        const angle = (360 / maxSize) * i - 90; // Start from top
                        const radius = 140;
                        const x = Math.cos((angle * Math.PI) / 180) * radius;
                        const y = Math.sin((angle * Math.PI) / 180) * radius;
                        
                        const isFront = pointers.front === i;
                        const isRear = pointers.rear === i;

                        return (
                            <div 
                                key={i}
                                className={`absolute w-16 h-16 border-2 flex flex-col items-center justify-center rounded-full transition-all duration-500 
                                    ${item ? `${item.color} border-white/50 text-white` : 'border-slate-700 bg-slate-800/50 text-slate-600'}
                                    ${(isFront || isRear) ? 'scale-110 z-20 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : ''}
                                `}
                                style={{ transform: `translate(${x}px, ${y}px)` }}
                            >
                                <span className="font-bold font-mono">{item ? item.value : i}</span>
                                
                                {/* Pointers */}
                                {isFront && (
                                    <div className="absolute -top-6 text-cyan-400 text-[10px] font-bold bg-slate-900 px-1 rounded border border-cyan-500">FRONT</div>
                                )}
                                {isRear && (
                                    <div className="absolute -bottom-6 text-purple-400 text-[10px] font-bold bg-slate-900 px-1 rounded border border-purple-500">REAR</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
         </div>

         {/* Logger */}
         <div className="h-40 bg-black/80 border-t border-slate-700 p-4 font-mono text-sm overflow-y-auto z-20">
            <div className="flex items-center gap-2 text-slate-500 mb-2 sticky top-0 bg-black/80 w-full py-1">
               <Terminal size={14} /> CONSOLE
            </div>
            <div className="space-y-1">
               {logs.map((log) => (
                 <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                    <span className="text-slate-600 shrink-0">[{log.time}]</span>
                    <span className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-cyan-300'}>
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
