import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface ApiKeyInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ApiKeyInput({ id, value, onChange, placeholder = "Enter API key" }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  const toggleVisibility = () => {
    setShowKey(!showKey);
  };

  // Display masked value unless showKey is true
  const displayValue = !showKey && value ? "•".repeat(Math.min(24, value.length)) : value;

  return (
    <div className="relative">
      <Input
        type={showKey ? "text" : "password"}
        id={id}
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute inset-y-0 right-0 h-full"
        onClick={toggleVisibility}
      >
        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
