"use client";

import { useState, useEffect } from "react";
import { Delete, ChevronDown, ChevronUp, Calculator as CalcIcon, X } from "lucide-react";

export type NbgRates = Record<string, number>;

export default function FloatingCalculator({ rates }: { rates: NbgRates }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Calculator state
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [currencyMode, setCurrencyMode] = useState<string | null>(null); // e.g. "USD"
  const [currencyDir, setCurrencyDir] = useState<"TO_FOREIGN" | "FROM_FOREIGN">("TO_FOREIGN");

  // Load state from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedState = localStorage.getItem("gndsf_calc_state");
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.isOpen !== undefined) setIsOpen(parsed.isOpen);
        if (parsed.display !== undefined) setDisplay(parsed.display);
        if (parsed.equation !== undefined) setEquation(parsed.equation);
        if (parsed.currencyMode !== undefined) setCurrencyMode(parsed.currencyMode);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isMounted) return;
    const stateToSave = { isOpen, display, equation, currencyMode, currencyDir };
    localStorage.setItem("gndsf_calc_state", JSON.stringify(stateToSave));
  }, [isOpen, display, equation, currencyMode, currencyDir, isMounted]);

  if (!isMounted) return null; // Avoid hydration mismatch

  // Handle calculator logic
  const handleNum = (num: string) => {
    if (display === "0" && num !== ".") setDisplay(num);
    else if (display === "Error") setDisplay(num);
    else setDisplay(display + num);
  };

  const handleOp = (op: string) => {
    if (display === "Error") return;
    setEquation(display + " " + op + " ");
    setDisplay("0");
  };

  const calculate = () => {
    if (!equation || display === "Error") return;
    try {
      const fullEq = equation + display;
      // safe eval for strict calculator operations
      // eslint-disable-next-line no-eval
      let res = eval(fullEq.replace("×", "*").replace("÷", "/"));
      // avoid long decimals
      res = Math.round(res * 10000) / 10000;
      setDisplay(String(res));
      setEquation("");
    } catch {
      setDisplay("Error");
      setEquation("");
    }
  };

  const clear = () => {
    setDisplay("0");
    setEquation("");
  };

  const backspace = () => {
    if (display === "Error") {
      setDisplay("0");
    } else if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  // Handle currency conversion
  const toggleCurrency = (code: string) => {
    if (display === "Error") return;
    
    // If user clicked the same currency, just toggle the direction instead of disabling it
    if (currencyMode === code) {
      setCurrencyDir(currencyDir === "TO_FOREIGN" ? "FROM_FOREIGN" : "TO_FOREIGN");
      return;
    }
    
    // Changing currency mode
    setCurrencyMode(code);
    setCurrencyDir("TO_FOREIGN"); // default direction
  };

  const getConvertedValue = () => {
    if (!currencyMode || !rates[currencyMode] || display === "Error") return null;
    const val = parseFloat(display);
    if (isNaN(val)) return null;
    
    if (currencyDir === "TO_FOREIGN") {
      const converted = val / rates[currencyMode];
      return `${val} GEL = ${converted.toFixed(2)} ${currencyMode}`;
    } else {
      const converted = val * rates[currencyMode];
      return `${val} ${currencyMode} = ${converted.toFixed(2)} GEL`;
    }
  };

  const btnClass = "flex h-10 items-center justify-center rounded border border-neutral-200 bg-neutral-50 text-sm font-medium hover:bg-neutral-100 active:bg-neutral-200 transition-colors";
  const opClass = "flex h-10 items-center justify-center rounded bg-neutral-200 text-sm font-semibold text-neutral-800 hover:bg-neutral-300 active:bg-neutral-400 transition-colors";
  const curClass = "flex h-8 items-center justify-center rounded text-xs font-semibold transition-colors";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Collapsed Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-wine text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${isOpen ? "mb-2" : ""}`}
        title="კალკულატორი"
      >
        {isOpen ? <X size={20} /> : <CalcIcon size={20} />}
      </button>

      {/* Calculator Body */}
      {isOpen && (
        <div className="w-[280px] rounded-xl border border-neutral-200 bg-white p-4 shadow-xl select-none animate-in fade-in slide-in-from-bottom-5">
          <div className="mb-3 text-right">
            <div className="text-xs text-neutral-400 h-4 min-h-[1rem] overflow-hidden whitespace-nowrap">
              {equation}
            </div>
            <div className="text-3xl font-semibold tracking-tight text-neutral-800 overflow-hidden text-ellipsis whitespace-nowrap">
              {display}
            </div>
            
            {/* Currency Result */}
            <div className={`text-xs mt-1 font-medium flex items-center justify-end gap-1 min-h-[16px] ${currencyMode ? "text-wine" : "text-transparent"}`}>
              {getConvertedValue() || " "}
              {currencyMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrencyMode(null);
                  }}
                  className="ml-2 rounded hover:bg-wine/10 px-1 py-0.5 text-wine/70 hover:text-wine"
                  title="გათიშვა"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Currency Toggle Row */}
          <div className="grid grid-cols-4 gap-1 mb-3">
            {["USD", "EUR", "GBP", "CHF"].map(code => (
              <button
                key={code}
                onClick={() => toggleCurrency(code)}
                title={rates[code] ? `1 ${code} = ${rates[code]} ₾ (დააჭირეთ გადასართავად)` : "Rate not found"}
                className={`${curClass} relative ${currencyMode === code ? "bg-wine text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
              >
                {code}
                {currencyMode === code && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-white text-[8px] font-bold text-wine shadow-sm">
                    {currencyDir === "TO_FOREIGN" ? "₾" : code[0]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button onClick={clear} className={`${opClass} text-red-600`}>C</button>
            <button onClick={backspace} className={opClass}>
              <Delete size={18} />
            </button>
            <button onClick={() => handleOp("%")} className={opClass}>%</button>
            <button onClick={() => handleOp("÷")} className={opClass}>÷</button>

            <button onClick={() => handleNum("7")} className={btnClass}>7</button>
            <button onClick={() => handleNum("8")} className={btnClass}>8</button>
            <button onClick={() => handleNum("9")} className={btnClass}>9</button>
            <button onClick={() => handleOp("×")} className={opClass}>×</button>

            <button onClick={() => handleNum("4")} className={btnClass}>4</button>
            <button onClick={() => handleNum("5")} className={btnClass}>5</button>
            <button onClick={() => handleNum("6")} className={btnClass}>6</button>
            <button onClick={() => handleOp("-")} className={opClass}>-</button>

            <button onClick={() => handleNum("1")} className={btnClass}>1</button>
            <button onClick={() => handleNum("2")} className={btnClass}>2</button>
            <button onClick={() => handleNum("3")} className={btnClass}>3</button>
            <button onClick={() => handleOp("+")} className={opClass}>+</button>

            <button onClick={() => handleNum("0")} className={`${btnClass} col-span-2`}>0</button>
            <button onClick={() => handleNum(".")} className={btnClass}>.</button>
            <button onClick={calculate} className="flex h-10 items-center justify-center rounded bg-wine text-base font-semibold text-white hover:bg-wine/90 transition-colors">
              =
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
