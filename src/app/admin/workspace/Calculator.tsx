"use client";

import { useState } from "react";
import { Delete } from "lucide-react";

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");

  const handleNum = (num: string) => {
    if (display === "0" && num !== ".") setDisplay(num);
    else setDisplay(display + num);
  };

  const handleOp = (op: string) => {
    setEquation(display + " " + op + " ");
    setDisplay("0");
  };

  const calculate = () => {
    if (!equation) return;
    try {
      const fullEq = equation + display;
      // using eval is safe here since we control the input entirely from buttons
      // eslint-disable-next-line no-eval
      const res = eval(fullEq.replace("×", "*").replace("÷", "/"));
      setDisplay(String(res));
      setEquation("");
    } catch {
      setDisplay("Error");
    }
  };

  const clear = () => {
    setDisplay("0");
    setEquation("");
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const btnClass = "flex h-12 items-center justify-center rounded border border-neutral-200 bg-neutral-50 text-lg font-medium hover:bg-neutral-100 active:bg-neutral-200 transition-colors";
  const opClass = "flex h-12 items-center justify-center rounded bg-neutral-200 text-lg font-semibold text-neutral-800 hover:bg-neutral-300 active:bg-neutral-400 transition-colors";

  return (
    <div className="w-full max-w-[300px] mx-auto select-none rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-4 text-right">
        <div className="text-xs text-neutral-400 h-4 min-h-[1rem] overflow-hidden">
          {equation}
        </div>
        <div className="text-3xl font-semibold tracking-tight text-neutral-800 overflow-hidden text-ellipsis">
          {display}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button onClick={clear} className={`${opClass} text-red-600`}>C</button>
        <button onClick={backspace} className={opClass}>
          <Delete size={20} />
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
        <button onClick={calculate} className="flex h-12 items-center justify-center rounded bg-wine text-lg font-semibold text-white hover:bg-wine/90 transition-colors">
          =
        </button>
      </div>
    </div>
  );
}
