import type { PersonaInfo } from "../types";

interface Props {
  personas: PersonaInfo[];
  activePersonaId: string;
  onChange: (personaId: string) => void;
  disabled?: boolean;
}

/**
 * Segmented toggle to switch persona. High-contrast: active = white bg + dark
 * text; inactive = translucent white text on the navy header. Always visible.
 */
export default function PersonaToggle({
  personas,
  activePersonaId,
  onChange,
  disabled,
}: Props) {
  if (personas.length === 0) return null;

  return (
    <div className="inline-flex rounded-full bg-white/15 p-1">
      {personas.map((p) => {
        const active = p.persona_id === activePersonaId;
        return (
          <button
            key={p.persona_id}
            type="button"
            onClick={() => onChange(p.persona_id)}
            disabled={disabled}
            className={[
              "rounded-full px-4 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
              active
                ? "bg-white text-phoenix-navy shadow-sm"
                : "text-white hover:bg-white/10",
            ].join(" ")}
          >
            {p.name}
          </button>
        );
      })}
    </div>
  );
}
