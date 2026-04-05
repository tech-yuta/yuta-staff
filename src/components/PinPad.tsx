"use client";

import { useState } from "react";

interface PinPadProps {
  onSubmit: (pin: string) => void;
  error?: string;
  isLoading?: boolean;
}

const PIN_LENGTH = 4;
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function PinPad({ onSubmit, error, isLoading }: PinPadProps) {
  const [pin, setPin] = useState("");

  function handleDigit(digit: string) {
    if (isLoading || pin.length >= PIN_LENGTH) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => {
        onSubmit(newPin);
        setPin("");
      }, 100);
    }
  }

  function handleDelete() {
    setPin((p) => p.slice(0, -1));
  }

  function handleClear() {
    setPin("");
  }

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < pin.length);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Entrez votre PIN</h1>
        <p className="text-gray-400 mt-1 text-sm">4 chiffres</p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-5">
        {dots.map((filled, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              filled
                ? "bg-indigo-600 border-indigo-600 scale-110"
                : "bg-transparent border-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm font-medium bg-red-50 px-4 py-2 rounded-xl">
          {error}
        </p>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3">
        {DIGITS.map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            disabled={isLoading}
            className="w-20 h-20 rounded-2xl bg-white border-2 border-gray-200 text-2xl font-semibold text-gray-800 active:bg-indigo-50 active:border-indigo-400 active:scale-95 transition-all disabled:opacity-40 shadow-sm select-none"
          >
            {digit}
          </button>
        ))}

        {/* Bottom row: clear | 0 | delete */}
        <button
          onClick={handleClear}
          disabled={isLoading}
          className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-gray-200 text-xs font-semibold text-gray-500 active:bg-gray-100 active:scale-95 transition-all disabled:opacity-40 select-none"
        >
          EFF.
        </button>
        <button
          onClick={() => handleDigit("0")}
          disabled={isLoading}
          className="w-20 h-20 rounded-2xl bg-white border-2 border-gray-200 text-2xl font-semibold text-gray-800 active:bg-indigo-50 active:border-indigo-400 active:scale-95 transition-all disabled:opacity-40 shadow-sm select-none"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-gray-200 text-2xl text-gray-500 active:bg-gray-100 active:scale-95 transition-all disabled:opacity-40 select-none"
        >
          ⌫
        </button>
      </div>

      {isLoading && (
        <p className="text-indigo-400 text-sm animate-pulse">Vérification...</p>
      )}
    </div>
  );
}
