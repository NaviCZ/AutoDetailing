
// src/components/ui/Checkbox.js
import { forwardRef } from "react";

const Checkbox = forwardRef(({ checked, onCheckedChange, className = "" }, ref) => {
  return (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={`h-4 w-4 cursor-pointer rounded border-gray-300 ${className}`}
    />
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };