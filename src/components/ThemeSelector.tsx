import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";

interface ThemeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const THEMES = [
  { value: "portfolio", label: "Portfolio" },
  { value: "tech", label: "Tech" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "blog", label: "Blog" },
  { value: "saas", label: "SaaS" },
];

export function ThemeSelector({ value, onChange, disabled }: ThemeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="theme">Theme</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="theme">
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent>
          {THEMES.map((theme) => (
            <SelectItem key={theme.value} value={theme.value}>
              {theme.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
