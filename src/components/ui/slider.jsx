import * as React from "react"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef(
  ({ className, min = 0, max = 100, step = 1, value, onValueChange, onValueCommit, ...props }, ref) => {
    // If only one value is provided or no value, default to single slider behavior
    const isDual = Array.isArray(value) && value.length === 2;
    const minVal = isDual ? value[0] : (value?.[0] ?? min);
    const maxVal = isDual ? value[1] : max;

    const handleMinChange = (e) => {
      const newValue = Number(e.target.value);
      if (isDual) {
        // Prevent thumbs from crossing
        const boundedValue = Math.min(newValue, maxVal - step);
        onValueChange?.([boundedValue, maxVal]);
      } else {
        onValueChange?.([newValue]);
      }
    };

    const handleMaxChange = (e) => {
      if (!isDual) return;
      const newValue = Number(e.target.value);
      // Prevent thumbs from crossing
      const boundedValue = Math.max(newValue, minVal + step);
      onValueChange?.([minVal, boundedValue]);
    };

    const handleCommit = () => {
      if (onValueCommit) {
        onValueCommit(isDual ? [minVal, maxVal] : [minVal]);
      }
    };

    // Calculate percentages for styling the track
    const minPercent = ((minVal - min) / (max - min)) * 100;
    const maxPercent = ((maxVal - min) / (max - min)) * 100;

    return (
      <div ref={ref} className={cn("relative w-full h-5 flex items-center group", className)} {...props}>
        {/* Track Background */}
        <div className="absolute w-full h-1 bg-gray-300 rounded-full" />
        
        {/* Active Track (Theme Color) */}
        <div 
          className="absolute h-1 bg-primary rounded-full" 
          style={{ 
            left: isDual ? `${minPercent}%` : '0%', 
            right: isDual ? `${100 - maxPercent}%` : `${100 - minPercent}%` 
          }}
        />

        {/* Min Thumb (or single thumb) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          onPointerUp={handleCommit}
          onKeyUp={handleCommit}
          className={cn(
            "absolute w-full h-1 appearance-none bg-transparent pointer-events-none",
            "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 sm:[&::-webkit-slider-thumb]:w-4 sm:[&::-webkit-slider-thumb]:h-4",
            "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 sm:[&::-moz-range-thumb]:w-4 sm:[&::-moz-range-thumb]:h-4",
            "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary",
            "[&::-moz-range-thumb]:appearance-none",
            isDual && minVal > max - (max - min) * 0.1 ? "z-20" : "z-10" // Push to top if it's near the right edge
          )}
        />

        {/* Max Thumb (only if dual) */}
        {isDual && (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={maxVal}
            onChange={handleMaxChange}
            onPointerUp={handleCommit}
            onKeyUp={handleCommit}
            className={cn(
              "absolute w-full h-1 appearance-none bg-transparent pointer-events-none",
              "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 sm:[&::-webkit-slider-thumb]:w-4 sm:[&::-webkit-slider-thumb]:h-4",
              "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
              "[&::-webkit-slider-thumb]:appearance-none",
              "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 sm:[&::-moz-range-thumb]:w-4 sm:[&::-moz-range-thumb]:h-4",
              "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary",
              "[&::-moz-range-thumb]:appearance-none",
              "z-10"
            )}
          />
        )}
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
