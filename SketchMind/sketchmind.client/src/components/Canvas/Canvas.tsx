import { memo } from 'react';
import './Canvas.css';

interface CanvasProps {
    svgContent: string;
    isLoading?: boolean;
}

const Canvas = memo(function Canvas({ svgContent, isLoading }: CanvasProps) {
    return (
        <div className="canvas-wrapper">
            {isLoading && (
                <div className="spinner-wrapper">
                    <div className="spinner-rings">
                        <div className="ring-outer" />
                        <div className="ring-inner" />
                        <div className="center-dot" />
                    </div>
                    <span className="spinner-label">מצייר... 🎨</span>
                </div>
            )}

            <div className="canvas-content" style={{ opacity: isLoading ? 0.2 : 1 }}>
                {svgContent ? (
                    <div
                        className="canvas-svg"
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                ) : (
                    <div className="canvas-placeholder">הציור שלך יופיע כאן...</div>
                )}
            </div>
        </div>
    );
});

export default Canvas;
