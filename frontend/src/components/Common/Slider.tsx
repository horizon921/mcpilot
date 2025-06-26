"use client";

import * as React from "react";
import classNames from "classnames";

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  showValue?: boolean;
  label?: string;
}

export const Slider: React.FC<SliderProps> = ({
  min = 0,
  max = 1,
  step = 0.01,
  value,
  defaultValue,
  onValueChange,
  showValue = true,
  label,
  className,
  ...props
}) => {
  const [internalValue, setInternalValue] = React.useState<number>(
    value !== undefined
      ? value
      : defaultValue !== undefined
      ? defaultValue
      : min
  );
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setInternalValue(v);
    onValueChange?.(v);
  };

  return (
    <div className={classNames("flex flex-col gap-1 w-full", className)}>
      {label && (
        <label className="text-xs font-medium mb-1 text-foreground">{label}</label>
      )}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={internalValue}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className={classNames(
            "w-full h-2 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary transition",
            "slider-thumb"
          )}
          {...props}
        />
        {showValue && (
          <span
            className="text-xs min-w-[36px] text-right text-foreground" // Use text-foreground for value color
          >
            {internalValue}
          </span>
        )}
      </div>
      <style jsx>{`
        input[type="range"].slider-thumb {
          /* Base track style */
          background: linear-gradient(to right, var(--color-primary) var(--value, 0%), var(--color-accent) var(--value, 0%));
          background-size: 100% 100%;
          background-repeat: no-repeat;
        }

        input[type="range"].slider-thumb::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px; /* Make track slightly thicker */
          background: var(--color-accent);
          border-radius: 2px;
        }

        input[type="range"].slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 2px solid var(--color-background); /* Use background for border */
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          margin-top: -6px; /* Adjust thumb position */
          transition: background 0.2s, border-color 0.2s;
        }

        input[type="range"].slider-thumb:focus::-webkit-slider-thumb {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        /* Firefox specific styles */
        input[type="range"].slider-thumb::-moz-range-track {
          width: 100%;
          height: 4px;
          background: var(--color-accent);
          border-radius: 2px;
        }

        input[type="range"].slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 2px solid var(--color-background);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          transition: background 0.2s, border-color 0.2s;
        }

        input[type="range"].slider-thumb:focus::-moz-range-thumb {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        /* IE/Edge specific styles */
        input[type="range"].slider-thumb::-ms-track {
          width: 100%;
          height: 4px;
          background: transparent; /* Needed for IE/Edge */
          border-color: transparent;
          color: transparent;
        }

        input[type="range"].slider-thumb::-ms-fill-lower {
          background: var(--color-primary);
          border-radius: 2px;
        }

        input[type="range"].slider-thumb::-ms-fill-upper {
          background: var(--color-accent);
          border-radius: 2px;
        }

        input[type="range"].slider-thumb::-ms-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 2px solid var(--color-background);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          transition: background 0.2s, border-color 0.2s;
        }

        input[type="range"].slider-thumb:focus::-ms-thumb {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        /* Dynamic background for filled portion */
        input[type="range"].slider-thumb {
          --value: calc((var(--internal-value) - var(--min)) / (var(--max) - var(--min)) * 100%);
        }
      `}</style>
    </div>
  );
};