"use client";

export function ToggleSwitch({ checked, onCheckedChange, id, disabled = false }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`w-11 h-6 shrink-0 rounded-full p-1 transition-colors duration-300 focus:outline-none relative flex items-center ${
        checked ? "bg-primary" : "bg-zinc-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div
        className={`size-4 bg-white rounded-full shadow-md transition-transform duration-300 transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
