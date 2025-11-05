import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PromptInput({ value, onChange, disabled }: PromptInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="prompt">Website Description</Label>
      <Textarea
        id="prompt"
        placeholder="Describe the website you want to generate... e.g., 'A modern portfolio website for a photographer with a gallery and contact form'"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="min-h-[120px] resize-none"
      />
      <p className="text-sm text-muted-foreground">
        Be specific about features, colors, layout, and functionality you want.
      </p>
    </div>
  );
}
