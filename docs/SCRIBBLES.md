

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

/* Grid layout for the value readouts at the bottom of the card */
.hmi-value-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
}

/* Individual Inset Value Box */
.hmi-value-box {
    background-color: var(--hmi-bg-field);
    border: 1px solid var(--hmi-border-light);
    box-shadow: inset 1px 1px 2px rgba(0,0,0,0.1); /* Creates the inset bevel look */
    padding: 4px;
    text-align: center;
}

            <div class="hmi-value-grid">
                <div class="hmi-value-box">
                    <div class="hmi-box-data">
                        <span class="hmi-value">--</span>
                    </div>
                </div>
            </div>


/* Container forcing layout alignment to the right boundary of the card */
.hmi-value-grid {
    display: flex;
    justify-content: flex-end; 
    align-items: center;
    padding: 12px;
    min-height: 40px;
}

/* Clear all padding/margins from the wrapper box */
.hmi-value-box {
    text-align: right;
    width: 100%;
    background: transparent !important; /* Strips away any default gray backgrounds */
    border: none !important;            /* Strips away accidental border boxes */
}

/* Core metric display text style (Strict ISA-101 Standards) */
.hmi-value {
    font-size: 20px;
    font-weight: bold;         /* Prominent bold layout weight for quick scanning */
    color: #333333;            /* Clear high-contrast charcoal parameter color */
    text-align: right;         /* Explicit alignment lock flush to the right */
    display: block;            /* Core block layout element to respect right-aligning rules */
}


			<div class="hmi-value-grid">
				<div class="hmi-value-box" style="display: flex; align-items: center; justify-content: center; min-height: 40px;">
					<!-- Generic module hooks straight into this specific class name -->
					<div class="hmi-value-temp" style="font-size: 20px; font-weight: bold; color: #333;">--.- °C</div>
				</div>
			</div>
