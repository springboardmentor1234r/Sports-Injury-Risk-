import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import humanBody from "../assets/images/human_body.png";
import "./BodyHeatmap.css";

function BodyHeatmap({ prediction }) {

    // x/y are % of the rendered IMAGE (not the whole card), measured
    // directly against human_body.png — the figure only occupies
    // roughly 7%-79% of the canvas height, so these follow the real
    // body, not an even 0-100 spread.
    const bodyParts = [
        {
            id: "shoulder",
            label: "Shoulder",
            risk: prediction?.shoulder_risk || "Low",
            x: 42,
            y: 20
        },
        {
            id: "hip",
            label: "Hip / Hamstring",
            risk: prediction?.hamstring_risk || "Low",
            x: 41,
            y: 41
        },
        {
            id: "knee",
            label: "Knee",
            risk: prediction?.acl_risk || "Low",
            x: 42,
            y: 61
        },
        {
            id: "ankle",
            label: "Ankle",
            risk: prediction?.ankle_sprain_risk || "Low",
            x: 42,
            y: 72
        }
    ];

    const getColor = (risk) => {
        switch (risk) {
            case "High":
                return "#ef4444";
            case "Medium":
                return "#f59e0b";
            default:
                return "#22c55e";
        }
    };

    // --- Refs to measure real rendered positions ---
    const containerRef = useRef(null);   // .heatmap-body (line canvas coordinate space)
    const imageRef = useRef(null);       // <img>
    const iconRefs = useRef({});         // one ref per body part's colored icon on the right

    const [lines, setLines] = useState([]); // [{id, x1, y1, x2, y2, color}]

    const measure = () => {
        const container = containerRef.current;
        const image = imageRef.current;
        if (!container || !image) return;

        const containerBox = container.getBoundingClientRect();
        const imageBox = image.getBoundingClientRect();

        const nextLines = bodyParts.map((part) => {
            // Dot position: % across the actual rendered image, converted
            // to pixels relative to the container (this is what avoids the
            // old SVG viewBox stretching problem — real pixels, no distortion).
            const x1 = (imageBox.left - containerBox.left) + (part.x / 100) * imageBox.width;
            const y1 = (imageBox.top - containerBox.top) + (part.y / 100) * imageBox.height;

            // Row anchor: center of that row's colored icon, wherever it
            // naturally landed in the normal flex flow.
            const iconEl = iconRefs.current[part.id];
            let x2 = x1 + 40;
            let y2 = y1;
            if (iconEl) {
                const iconBox = iconEl.getBoundingClientRect();
                x2 = (iconBox.left - containerBox.left);
                y2 = (iconBox.top - containerBox.top) + iconBox.height / 2;
            }

            return { id: part.id, x1, y1, x2, y2, color: getColor(part.risk) };
        });

        setLines(nextLines);
    };

    useLayoutEffect(() => {
        measure();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const onResize = () => measure();
        window.addEventListener("resize", onResize);

        // Re-measure once the image finishes loading (dimensions are 0 before that)
        const imgEl = imageRef.current;
        if (imgEl && !imgEl.complete) {
            imgEl.addEventListener("load", onResize);
        }

        // Also watch for layout shifts (font load, container resize, etc.)
        let ro;
        if (containerRef.current && "ResizeObserver" in window) {
            ro = new ResizeObserver(() => measure());
            ro.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener("resize", onResize);
            if (imgEl) imgEl.removeEventListener("load", onResize);
            if (ro) ro.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="card heatmap-card">

            <h2>Human Body Risk Map</h2>

            <div className="heatmap-body" ref={containerRef}>

                {/* CONNECTOR LINES — drawn in real pixel space, so they always
                    point from the exact dot to the exact row, however the
                    rows end up spaced */}
                <svg className="connector-svg">
                    {lines.map((line) => (
                        <line
                            key={line.id}
                            x1={line.x1}
                            y1={line.y1}
                            x2={line.x2}
                            y2={line.y2}
                            stroke={line.color}
                            strokeWidth="2"
                            strokeDasharray="6 5"
                        />
                    ))}
                </svg>

                {/* LEFT: BODY IMAGE + DOTS */}
                <div className="body-image-wrap">

                    <img
                        ref={imageRef}
                        src={humanBody}
                        alt="Human Body"
                        className="human-body"
                    />

                    {bodyParts.map((part) => (
                        <span
                            key={part.id}
                            className="body-dot"
                            style={{
                                top: `${part.y}%`,
                                left: `${part.x}%`,
                                background: getColor(part.risk),
                                color: getColor(part.risk)
                            }}
                        />
                    ))}

                </div>

                {/* RIGHT: LABEL ROWS — normal flex flow, so they can
                    never overlap regardless of where the dots sit */}
                <div className="risk-rows">

                    {bodyParts.map((part) => (
                        <div key={part.id} className="risk-row">

                            <span
                                ref={(el) => (iconRefs.current[part.id] = el)}
                                className="risk-icon"
                                style={{
                                    background: getColor(part.risk),
                                    color: getColor(part.risk)
                                }}
                            />

                            <div className="risk-text">
                                <h3>{part.label}</h3>
                                <p style={{ color: getColor(part.risk) }}>
                                    {part.risk} Risk
                                </p>
                            </div>
                        </div>
                    ))}

                </div>

            </div>

            {/* LEGEND */}
            <div className="legend">

                <div className="legend-item">
                    <span className="legend-color" style={{ background: "#ef4444" }}></span>
                    High Risk
                </div>

                <div className="legend-item">
                    <span className="legend-color" style={{ background: "#f59e0b" }}></span>
                    Medium Risk
                </div>

                <div className="legend-item">
                    <span className="legend-color" style={{ background: "#22c55e" }}></span>
                    Low Risk
                </div>

            </div>

        </div>
    );
}

export default BodyHeatmap;
