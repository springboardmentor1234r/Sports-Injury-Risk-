import sys
import os
import re
from pptx import Presentation

def build_sird_pptx():
    template_path = 'Presentation - CampusEventHub Overview Edited 7thOCT (3).pptx'
    output_path = 'Sports_Injury_Risk_Detection_Presentation.pptx'

    if not os.path.exists(template_path):
        print(f"Error: Template file {template_path} not found.")
        return

    prs = Presentation(template_path)
    print(f"Loaded template with {len(prs.slides)} slides.")

    # Dictionary of text replacements per slide (0-indexed)
    slide_replacements = {
        # Slide 1: Title Slide
        0: {
            "CampusEventHub": "Sports Injury Risk Detection System",
            "INTER COLLEGE EVENT MANAGEMENT PLATFORM": "AI-Powered Biomechanical Motion Analysis & Real-Time Injury Prevention Platform"
        },
        # Slide 2: Technology Stack
        1: {
            "Technology Stack: The MERN Framework Explained": "Technology Stack: System Architecture & Framework",
            "React: The User Interface Library": "React & HTML5 Canvas UI",
            "React enhances user experiences through component-based architecture, allowing for dynamic, interactive web applications.": "React and HTML5 Canvas enable real-time skeletal overlays (Red Joint Nodes & Yellow Bone Lines) and interactive 3D radar charts.",
            "Express.js: The Fast Framework": "FastAPI Async Backend",
            "Express.js simplifies server-side development, enabling quick API creation with minimal overhead for applications.": "High-performance Python FastAPI server handles high-throughput video streams, MediaPipe 3D pose extraction, and ML inference.",
            "MongoDB: The NoSQL Database": "MongoDB Atlas Database",
            "MongoDB provides a flexible document structure, ideal for handling various data types efficiently.": "Async Motor driver stores 33 3D body keypoints, time-series telemetry, ML prediction reports, and user profile data.",
            "Node.js:  The JavaScript Runtime environment": "MediaPipe & Scikit-Learn ML",
            "Node.js lets developers use JavaScript to write command line tools and server-side scripting": "Google MediaPipe tracks 33 body keypoints at 25+ FPS; Scikit-Learn Random Forest models classify 6 injury risk categories.",
            "Node.js": "Python & ML"
        },
        # Slide 3: Core Features
        2: {
            "Core Features of CampusEventHub Platform": "Core Capabilities of SIRD Platform",
            "Interactive Feedback System": "Autonomous Generative AI Agent",
            "Attendees provide valuable insights, enhancing future events and user satisfaction.": "Google Gemini AI Agent (gemini-3.7-flash) generates personalized clinical exercise prescriptions with kinematic fallback.",
            "Seamless Registration Process": "5-Factor Weighted Risk Model",
            "Participants can register in just a few clicks, ensuring a smooth user experience.": "Composite risk scoring: 35% Biomechanics + 20% History + 20% Asymmetry + 15% Training Load + 10% Fatigue.",
            "Event Creation Made Easy": "Live Skeletal Motion Camera",
            "Users can effortlessly set up events with clear, guided steps and customizable options.": "Real-time webcam viewfinder rendering red joint nodes and yellow bone connection lines with instant webm video upload."
        },
        # Slide 4: Problem Statement
        3: {
            "Challenges Facing Event Management in Colleges": "Challenges in Sports Injury Management",
            "Poor Engagement": "Manual Visual Inspection",
            "Students often face difficulties in discovering relevant events, resulting in low participation rates and engagement levels. This disconnect between event creators and students diminishes the overall campus experience for everyone involved.": "Trainer observation relies on subjective visual assessment, missing subtle dynamic knee valgus collapse, trunk sway, and bilateral asymmetry.",
            "Manual Processes": "Delayed Injury Risk Intervention",
            "Current event management relies heavily on manual processes, leading to time-consuming tasks and increased chances of human error, making it difficult for organizers to efficiently coordinate activities across different colleges.": "Injuries are typically diagnosed after structural damage occurs rather than proactively predicted using continuous biomechanical telemetry.",
            "Inefficiencies": "Lack of Explainable AI (XAI)",

            "The existing system suffers from inefficient communication channels that hinder timely updates and feedback collection, which can lead to missed opportunities for improvement and a lack of real-time information for participants.": "Traditional ML models act as black boxes without natural language rationale explaining the exact kinematic causes behind elevated risk scores.",
            "Streamlined Event Management": "Streamlined Biomechanical Platform",
            "Implementing a centralized platform will facilitate streamlined event management, allowing for better communication, enhanced collaboration, and a more user-friendly experience that ultimately drives higher engagement and participation rates.": "Centralizing 3D pose extraction, Random Forest predictions, and AI prescriptions into a multi-role web platform enables early injury prevention."
        },
        # Slide 5: System Architecture
        4: {
            "CampusEventHub": "SIRD Platform",
            "Modular Design: Each feature operates independently, allowing for easy updates and enhancements.": "Modular Micro-Engine Architecture: Decoupled video processing, ML inference, anomaly detection, and recommendation engines.",
            "APIs for Integration: RESTful APIs facilitate seamless communication between different services and components.": "RESTful API Integration: FastAPI endpoints serving 3D keypoint telemetry, automated PDF/CSV reports, and real-time alerts.",
            "Data Security: Implementation of JWT for secure user sessions and data encryption safeguards user information.": "Role-Based Access Control: JWT Bearer authentication securing Athlete, Coach, Physiotherapist, Scientist, and Admin views.",
            "Scalability: The architecture supports horizontal scaling to accommodate growing user demands without compromising performance.": "Scalable Asynchronous Storage: Motor Async MongoDB Atlas driver handling high-throughput time-series keypoint telemetry."
        },
        # Slide 6: Challenges and Solutions
        5: {
            "Challenges and Solutions in CampusEventHub": "Challenges & Engineering Solutions in SIRD System",
            "Scalability Solutions": "Real-Time Canvas Rendering",
            "Utilizing a modular design allows the platform to adapt and grow seamlessly, accommodating increasing user numbers and event complexity without compromising performance.": "Optimized HTML5 Canvas requestAnimationFrame loop rendering 33 joint nodes and bone segments live at 25+ FPS without UI lag.",
            "Security Enhancements": "Explainable AI (XAI) Rationale",
            "Implementing JWT authentication and robust encryption protocols ensures that user data is protected, minimizing the risks associated with unauthorized access and maintaining confidentiality.": "Dynamic feature attribution generating plain language rationale notes explaining specific joint angle breakdowns (e.g. Knee Valgus 14.2°).",
            "User Engagement Strategies": "Generative AI Agent Integration",
            "Enhancing the user interface with intuitive design and real-time updates fosters greater user involvement, making it easier for students and colleges to engage with events and each other.": "Google Gemini LLM integration with local Kinematic AI Expert fallback ensuring 100% recommendation uptime.",
            "Modular Design Advantages": "Multi-Role Tailored Dashboards",
            "A modular architecture not only simplifies updates but also facilitates integration with third-party services, ensuring flexibility and future-proofing the platform as new technologies emerge.": "Customized analytical workspaces tailored for Athletes, Coaches, Physiotherapists, Sports Scientists, and System Admins."
        },
        # Slide 7: Measurable Outcomes
        6: {
            "Enhanced User Satisfaction": "High ML Model Accuracy",
            "Users report a significant improvement in their experience, with streamlined navigation and intuitive design elements.": "Cross-validated Random Forest models achieving 89.6% to 97.4% precision across 6 injury categories.",
            "Reduced Manual Coordination": "Proactive Risk Reduction",
            "Automation features have effectively minimized the time spent on organizing events, making processes smoother and faster.": "Early identification of dynamic knee valgus collapse and force imbalance before physical injury manifestation.",
            "Increased Event Participation": "Automated Practitioner Workflow",
            "Our platform has led to a notable rise in student engagement, resulting in more events attended.": "Instant 1-click formatted PDF Medical Summary Reports and CSV Telemetry Data exports.",
            "Measurable Outcomes and Positive Impact": "Measurable Impact & Clinical Validation"
        },
        # Slide 8: UI Mock-ups
        7: {
            "These mock-ups showcase a seamless experience for users, enhancing engagement through intuitive design and functionality.": "SIRD Multi-Role Dashboard Interface: Interactive 3D Radar Chart, Body Heatmap, Live Camera Viewfinder, and Exercise Prescriptions."
        },
        # Slide 9: Workflow Process
        8: {
            "College Admin Registration Process": "Athlete Motion Assessment Workflow",
            "Simple User Onboarding Steps": "1. Motion Video Submission",
            "The registration process for college admins is designed to be straightforward and efficient.": "Athlete uploads a video file or records live motion via the embedded HTML5 webcam capture modal.",
            "Secure Authentication Features": "2. Pose Extraction & ML Inference",
            "Admins undergo a secure authentication process to ensure data protection and privacy.": "MediaPipe extracts 33 3D keypoints; Random Forest models predict 6 category risks and 5-factor risk score.",
            "Comprehensive Dashboard Access": "3. Multi-Role Triage & AI Prescriptions",
            "Once registered, admins gain access to a comprehensive dashboard for event management.": "Results populate Athlete dashboards, alert assigned Coaches/Physios, and trigger Gemini AI exercise routines."
        },
        # Slide 10: Future Enhancements
        9: {
            "Future Enhancements for CampusEventHub": "Future Enhancements for SIRD Platform",
            "Secure and Efficient Payment Integration": "Wearable Sensor Fusion",
            "Streamline payment processes for event registrations, ensuring secure and user-friendly transactions.": "Integrating IMU accelerometer and sEMG muscle activation sensor streams with video keypoints.",
            "Multiple payment options (UPI, cards, net banking, wallets) for convenience.": "Multi-modal sensor fusion for sub-millisecond biomechanical load tracking.",
            "Fraud detection mechanisms and encrypted transactions for safety.": "Real-time synchronization with smartwatch athletic metrics.",
            "Advanced Analytics Dashboard for Insights": "Automated 3D Kinematic Avatar Rendering",
            "Provide real-time analytics to help colleges track event success and user engagement metrics efficiently.": "Three.js WebGL avatar rendering displaying real-time joint stress vectors.",
            "Predictive analytics to forecast turnout for future events.": "Interactive 360-degree rotation of skeletal motion captures.",
            "Comparative analysis of multiple events to identify trends and improvement areas.": "Visualizing peak ground reaction forces on individual muscle groups.",
            "AI Recommendations for Enhanced User Experience": "Predictive Recovery Modeling",
            "Utilize AI to provide personalized event suggestions based on user interests and past attendance.": "Time-series LSTM neural networks forecasting long-term rehabilitation recovery curves.",
            "Smart reminders for upcoming events the user might be interested in.": "Adaptive training load adjustment based on daily fatigue logs.",
            "Continuous learning from feedback to refine future suggestions.": "Automated return-to-play readiness index for sports physiotherapists."
        },
        # Slide 11: Team Members
        10: {
            "TEAM MEMBERS": "SIRD PROJECT TEAM MEMBERS",
            "Satyam Mohanty": "Lead Developer & AI Architect",
            "Samruddhi Garge": "Machine Learning Engineer",
            "Jayanth Reddy": "Frontend UI/UX Specialist",
            "Sahil Tripathy": "Backend & Cloud Engineer",
            "Abinaya Sri": "Biomechanics Research Lead",
            "Srishti Sinha": "Quality Assurance & Testing"
        },
        # Slide 12: Presentation Video
        11: {
            "Presentation Video...https://drive.google.com/file/d/1GAGHVWyuiXgearCHCusDrzPZBf9mK978/view?usp=sharing": "Live Demonstration & System Overview Video: https://drive.google.com/file/d/1GAGHVWyuiXgearCHCusDrzPZBf9mK978/view?usp=sharing"
        }
    }

    # Iterate through slides and replace text inside shape textframes
    for slide_idx, slide in enumerate(prs.slides):
        if slide_idx in slide_replacements:
            repl_map = slide_replacements[slide_idx]
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        full_text = paragraph.text
                        for old_txt, new_txt in repl_map.items():
                            if old_txt in full_text:
                                # Replace preserving paragraph text
                                new_full = full_text.replace(old_txt, new_txt)
                                # Assign to paragraph
                                paragraph.text = new_full
                                full_text = new_full

    prs.save(output_path)
    print(f"[+] Successfully generated SIRD presentation PPTX at: {output_path}")

if __name__ == "__main__":

    build_sird_pptx()
