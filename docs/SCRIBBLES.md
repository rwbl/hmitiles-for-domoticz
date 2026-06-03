

/* --- GENERIC HARDWARE TAG DISPLAY (LIBRARY MODE) */
.hmi-pack-card[data-device-idx]::after {
    content: "TAG: IDX " attr(data-device-idx); 
    position: absolute;
    /* Inward positioning adjustments to clear all borders */
    bottom: 8px;
    right: 12px;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    font-weight: bold;
    /* Soft industrial slate gray tone to blend with theme background */
    color: #7f8c8d;
    background: #e1e1e1;
    padding: 2px 6px;
    border-radius: 3px;
    border: 1px solid #c0c0c0;
    pointer-events: none; 
    letter-spacing: 0.5px;
}

/* Ensure the parent card container allows absolute positioning inside it */
.hmi-pack-card {
    position: relative !important;
}
