import React from "react";
import {
    FaVideo,
    FaClock,
    FaExpand,
    FaPlayCircle
} from "react-icons/fa";

import "./VideoPreviewCard.css";

function VideoPreviewCard({ analysis }) {

    const video = analysis?.processed_video;

    const info = analysis?.video_info;

    return (

        <div className="video-preview-card">

            <div className="video-header">

                <h2>

                    <FaVideo />

                    Athlete Video

                </h2>

            </div>

            <div className="video-player">

                <video
                    controls
                    autoPlay={false}
                    src={`http://127.0.0.1:8000/${video}`}
                />

            </div>

            <div className="video-info-grid">

                <div className="video-info">

                    <FaClock />

                    <div>

                        <span>Duration</span>

                        <strong>

                            {info?.duration_seconds}s

                        </strong>

                    </div>

                </div>

                <div className="video-info">

                    <FaExpand />

                    <div>

                        <span>Resolution</span>

                        <strong>

                            {info?.width} × {info?.height}

                        </strong>

                    </div>

                </div>

                <div className="video-info">

                    <FaPlayCircle />

                    <div>

                        <span>FPS</span>

                        <strong>

                            {info?.fps}

                        </strong>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default VideoPreviewCard;