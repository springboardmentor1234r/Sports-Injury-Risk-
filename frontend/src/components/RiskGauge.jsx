import React from "react";
import ReactECharts from "echarts-for-react";
import "./RiskGauge.css";

function RiskGauge({ riskScore }) {

    const score = riskScore?.overall_score || 0;
    const level = riskScore?.risk_level || "Low";

    const levelColor =
    level === "High"
        ? "#ef4444"
        : level === "Moderate"
        ? "#f59e0b"
        : "#22c55e";

    const option = {

        backgroundColor: "transparent",

        series: [

            {
                type: "gauge",

                // A near-semicircle (180°) instead of the old 240° sweep.
                // The old 210 -> -30 pushed both ends BELOW the horizontal
                // line, which is what squashed the colors and made the
                // whole gauge look tall and lopsided.
                startAngle: 200,
                endAngle: -20,

                min: 0,
                max: 100,
                radius: "92%",
                center: ["50%", "58%"],

                progress: {
                    show: true,
                    roundCap: true,
                    width: 22,
                    // Without this, the filled portion (0 -> score) ignores
                    // the axisLine gradient entirely and renders in ECharts'
                    // default theme blue — that's the blue arc you're seeing
                    // from 0 up to the pointer. "auto" makes it pick up
                    // whatever color the axisLine has at that point instead.
                    itemStyle: {
                        color: "auto"
                    }
                },

                axisLine: {
                    roundCap: true,
                    lineStyle: {
                        width: 22,
                        color: [
                            [0.65, "#ef4444"],
                            [0.85, "#facc15"],
                            [1, "#22c55e"]
                        ]
                    }
                },

                pointer: {
                    icon: "rect",
                    length: "60%",
                    width: 7,
                    itemStyle: {
                        color: "#ffffff",
                        shadowBlur: 10,
                        shadowColor: "#ffffff"
                    }
                },

                axisTick: {
                    show: false
                },

                splitLine: {
                    show: false
                },

                // Only show labels at 0 / 50 / 100, like the reference —
                // showing every 10 is what made the old version look cluttered.
                axisLabel: {
                    color: "#9ca3af",
                    distance: 22,
                    fontSize: 13,
                    formatter: function (value) {
                        return value === 0 || value === 50 || value === 100
                            ? value
                            : "";
                    }
                },

                title: {
                    show: false
                },

                detail: {
                    valueAnimation: true,
                    offsetCenter: [0, "25%"],
                    fontSize: 46,
                    fontWeight: "bold",
                    color: levelColor,
                    formatter: function (value) {
                        return value;
                    }
                },

                data: [
                    {
                        value: score,
                        name: `${level} Risk`
                    }
                ]
            }
        ]
    };

    return (
        <div className="card risk-gauge-card">

            <div className="card-header">
                <h3>Overall Risk Score</h3>
            </div>

            <ReactECharts
                option={option}
                style={{
                    height: "250px",
                    width: "100%"
                }}
            />

            <p className="risk-level-text" style={{ color: levelColor }}>
                {level} Risk
            </p>

            {level === "High" && (
                <div className="risk-warning">
                    <span className="risk-warning-icon">⚠</span>
                    Immediate attention recommended
                </div>
            )}

            <div className="risk-status">

                <div className="status-box">
                    <span>Status</span>
                    <strong>{level} Risk</strong>
                </div>

                <div className="status-box">
                    <span>Score</span>
                    <strong>{score}/100</strong>
                </div>

            </div>

        </div>
    );
}

export default RiskGauge;
