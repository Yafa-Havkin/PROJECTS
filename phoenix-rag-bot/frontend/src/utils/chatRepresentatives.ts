import representative1 from "../assets/agents/representative-1.webp";
import representative2 from "../assets/agents/representative-2.webp";
import representative3 from "../assets/agents/representative-3.webp";
import representative4 from "../assets/agents/representative-4.webp";

export interface ChatRepresentative {
  id: string;
  image: string;
}

export const CHAT_REPRESENTATIVES: ChatRepresentative[] = [
  { id: "representative-1", image: representative1 },
  { id: "representative-2", image: representative2 },
  { id: "representative-3", image: representative3 },
  { id: "representative-4", image: representative4 },
];

export function pickChatRepresentative(
  previousId?: string,
): ChatRepresentative {
  const available = CHAT_REPRESENTATIVES.filter(
    (representative) => representative.id !== previousId,
  );
  const choices = available.length > 0 ? available : CHAT_REPRESENTATIVES;
  return choices[Math.floor(Math.random() * choices.length)];
}
