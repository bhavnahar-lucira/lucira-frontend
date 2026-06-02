import * as React from "react"

const Slider = React.forwardRef(
  ({ className, min = 0, max = 100, step = 1, value, onValueChange, ...props }, ref) => {
    const handleChange = (e) => {
      const newValue = Number(e.target.value);
      onValueChange?.([newValue]);
    };

    return (
      <div className={`w-full ${className || ""}`}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value?.[0] || min}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          style={{
            background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${
              ((value?.[0] || min) - min) / (max - min) * 100
            }%, rgb(229, 231, 235) ${((value?.[0] || min) - min) / (max - min) * 100}%, rgb(229, 231, 235) 100%)`,
          }}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
