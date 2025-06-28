// Useful for making some properties of an interface optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Useful for making some properties of an interface required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Represents a value that could be null or undefined
export type Optional<T> = T | null | undefined;

// For UI states, e.g., loading, error, success
export type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

export interface OptionType<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
  [key: string]: any; // For additional properties like icons, etc.
}

// For key-value pairs, like query parameters or headers
export type KeyValuePairs = Record<string, string | number | boolean | undefined>;

// For component props that include children
export interface ChildrenProps {
  children: React.ReactNode;
}

// For component props that include className
export interface ClassNameProps {
  className?: string;
}

// For component props that include both children and className
export interface ChildrenAndClassNameProps extends ChildrenProps, ClassNameProps {}