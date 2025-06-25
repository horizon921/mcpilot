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
            "w-full h-2 rounded-lg appearance-none bg-accent focus:outline-none focus:ring-2 focus:ring-primary transition",
            "slider-thumb"
          )}
          style={{
            accentColor: "var(--color-primary)",
          }}
          {...props}
        />
        {showValue && (
          <span
            className="text-xs min-w-[36px] text-right"
            style={{ color: "var(--color-primary)" }}
          >
            {internalValue}
          </span>
        )}
      </div>
      <style jsx>{`
        input[type="range"].slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 2px solid var(--color-background);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          transition: background 0.2s;
        }
        input[type="range"].slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 2px solid var(--color-background);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          transition: background 0.2s;
        }
        input[type="range"].slider-thumb::-ms-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 2px solid var(--color-background);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          transition: background 0.2s;
        }
        input[type="range"].slider-thumb:focus::-webkit-slider-thumb {
          outline: 2px solid var(--color-primary);
        }
        input[type="range"].slider-thumb::-webkit-slider-runnable-track {
          height: 2px;
          background: var(--color-accent);
        }
        input[type="range"].slider-thumb::-ms-fill-lower {
          background: var(--color-accent);
        }
        input[type="range"].slider-thumb::-ms-fill-upper {
          background: var(--color-accent);
        }
      `}</style>
    </div>
  );
};