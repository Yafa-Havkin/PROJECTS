import type { Drawing } from '../../types';
import './Header.css';

interface HeaderProps {
    gallery: Drawing[];
    selectedId: string;
    currentSvg: string;
    isLoading: boolean;
    canUndo: boolean;
    canRedo: boolean;
    onSelectChange: (id: string) => void;
    onSave: () => void;
    onNew: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onClear: () => void;
    onSendEmail: (email: string) => void;
}

export default function Header({
    gallery, selectedId, currentSvg, isLoading,
    canUndo, canRedo,
    onSelectChange, onSave, onNew, onUndo, onRedo, onClear, onSendEmail
}: HeaderProps) {
    return (
        <div className="header">
            <select
                className="header-select"
                value={selectedId}
                onChange={(e) => onSelectChange(e.target.value)}
            >
                <option value="">Drawing #10</option>
                {gallery.map((drawing) => (
                    <option key={drawing.id} value={drawing.id.toString()}>
                        {drawing.name || `Drawing #${drawing.id}`}
                    </option>
                ))}
            </select>

            <button className="btn btn-blue" onClick={onNew}>+ New Drawing</button>
            <button
                className="btn btn-green"
                onClick={() => {
                    const email = window.prompt("לאיזו כתובת מייל לשלוח את הציור?");
                    if (!email) return;
                    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                    if (!isValid) { alert("כתובת המייל אינה תקינה."); return; }
                    onSendEmail(email);
                }}
            >
                Send
            </button>
            <button className="btn btn-yellow" onClick={onUndo} disabled={!canUndo}>Undo</button>
            <button className="btn btn-cyan" onClick={onRedo} disabled={!canRedo}>Redo</button>
            <button className="btn btn-red" onClick={onClear} disabled={!currentSvg}>Clear</button>
            <button className="btn btn-purple" onClick={onSave} disabled={!currentSvg || isLoading}>
                {isLoading ? 'שומר...' : 'Save'}
            </button>
        </div>
    );
}
