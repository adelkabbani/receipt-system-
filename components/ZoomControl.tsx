'use client';

import { useEffect } from 'react';

export function ZoomControl() {
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.altKey) {
                e.preventDefault();
                const currentZoom = parseFloat(document.body.style.zoom || "1");
                // Scroll down (positive deltaY) means zoom out, Scroll up means zoom in
                const zoomAmount = e.deltaY > 0 ? -0.1 : 0.1;
                document.body.style.zoom = String(Math.max(0.3, Math.min(currentZoom + zoomAmount, 3)));
            }
        };

        // passive: false is required to call preventDefault on wheel events
        window.addEventListener('wheel', handleWheel, { passive: false });

        return () => window.removeEventListener('wheel', handleWheel);
    }, []);

    return null;
}
