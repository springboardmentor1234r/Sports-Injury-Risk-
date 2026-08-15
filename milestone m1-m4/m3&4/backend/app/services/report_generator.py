import csv
import io
import datetime
from sqlalchemy.orm import Session
from app import models, crud
from app.services.analytics import OvertrainingRiskAnalytics, BiomechanicalAnalytics
from app.services.intelligence import AthleteIntelligenceService, DISCLAIMER

class ReportGeneratorService:
    @staticmethod
    def generate_csv_report(db: Session, athlete_id: int) -> str:
        """
        Compiles all training activity and injury records into a single CSV string.
        """
        athlete = crud.get_athlete_full_profile(db, athlete_id)
        if not athlete:
            return ""
            
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write Title Header
        writer.writerow(["ATHLETE HUB - PERFORMANCE AND HEALTH REPORT"])
        writer.writerow(["Athlete Name", athlete.user.full_name])
        writer.writerow(["Sport", athlete.sport or "Unspecified"])
        writer.writerow(["Report Date", str(datetime.date.today() if 'datetime' in globals() else "Current Date")])
        writer.writerow([])

        assessment = db.query(models.IntelligenceAssessment).filter(models.IntelligenceAssessment.athlete_id == athlete_id).order_by(models.IntelligenceAssessment.assessed_at.desc()).first()
        if assessment:
            writer.writerow(["--- ATHLETE INTELLIGENCE ASSESSMENT ---"])
            writer.writerow(["Assessment date", assessment.assessed_at])
            writer.writerow(["Injury risk score", assessment.injury_risk_score])
            writer.writerow(["Risk category", assessment.risk_category])
            writer.writerow(["Movement quality", assessment.movement_quality_score])
            writer.writerow(["Biomechanical efficiency", assessment.biomechanical_efficiency_score])
            writer.writerow(["Fatigue risk", assessment.fatigue_risk_score])
            writer.writerow(["Overall athlete health", assessment.health_score])
            writer.writerow(["Disclaimer", DISCLAIMER])
            writer.writerow([])
        
        # Section 1: Physical Parameters
        writer.writerow(["--- PHYSICAL CHARACTERISTICS ---"])
        writer.writerow(["Height (cm)", athlete.height_cm or "N/A"])
        writer.writerow(["Weight (kg)", athlete.weight_kg or "N/A"])
        writer.writerow(["Date of Birth", athlete.date_of_birth or "N/A"])
        writer.writerow([])
        
        # Section 2: Training Log
        writer.writerow(["--- TRAINING ACTIVITIES LOG ---"])
        writer.writerow(["ID", "Date", "Activity Type", "Duration (Min)", "RPE (1-10)", "Calculated Load", "Notes"])
        for load in athlete.training_load:
            writer.writerow([
                load.id,
                load.date,
                load.activity_type,
                load.duration_minutes,
                load.rpe,
                load.calculated_load,
                load.notes or ""
            ])
        writer.writerow([])
        
        # Section 3: Injury History
        writer.writerow(["--- INJURY AND RECOVERY HISTORY ---"])
        writer.writerow(["ID", "Occurrence Date", "Injury Type", "Body Part", "Severity", "Recovery Status", "Therapy Notes"])
        for inj in athlete.injury_history:
            writer.writerow([
                inj.id,
                inj.occurrence_date,
                inj.injury_type,
                inj.body_part,
                inj.severity,
                inj.status,
                inj.notes or ""
            ])
            
        return output.getvalue()

    @staticmethod
    def generate_html_report(db: Session, athlete_id: int) -> str:
        """
        Generates a premium print-ready HTML page aggregating biomechanics and risk profiles.
        """
        athlete = crud.get_athlete_full_profile(db, athlete_id)
        if not athlete:
            return "<h3>Athlete profile not found.</h3>"
            
        # Preserve legacy workload content, while including the latest stored assessment where available.
        mock_biomechanics = {"symmetry_index": 95.0, "posture_deviation_score": 5.0}
        
        # If there are videos, read from the latest analyzed video
        latest_video = db.query(models.Video)\
                        .filter(models.Video.athlete_id == athlete_id, models.Video.status == "analyzed")\
                        .order_by(models.Video.uploaded_at.desc()).first()
                        
        if latest_video and latest_video.skeletal_data:
            mock_biomechanics = BiomechanicalAnalytics.analyze_skeletal_data(latest_video.skeletal_data)
            
        prediction = OvertrainingRiskAnalytics.predict_injury_risk(db, athlete_id, mock_biomechanics)
        assessment = db.query(models.IntelligenceAssessment).filter(models.IntelligenceAssessment.athlete_id == athlete_id).order_by(models.IntelligenceAssessment.assessed_at.desc()).first()
        acwr = prediction["acwr_metrics"]
        
        # Compose training log rows
        training_rows = ""
        for load in athlete.training_load[:10]: # show last 10
            training_rows += f"""
            <tr>
                <td>{load.date}</td>
                <td>{load.activity_type}</td>
                <td>{load.duration_minutes}m</td>
                <td>{load.rpe}/10</td>
                <td style="font-weight:bold;color:#0088cc;">{load.calculated_load}</td>
            </tr>
            """
            
        # Compose injury rows
        injury_rows = ""
        for inj in athlete.injury_history:
            severity_color = "#ff4d4d" if inj.severity == "High" else "#ffae00" if inj.severity == "Medium" else "#0edb89"
            injury_rows += f"""
            <tr>
                <td>{inj.occurrence_date}</td>
                <td>{inj.injury_type} ({inj.body_part})</td>
                <td><span style="color:{severity_color};font-weight:bold;">{inj.severity}</span></td>
                <td>{inj.status}</td>
                <td style="font-size:12px;color:#666;">{inj.notes or '--'}</td>
            </tr>
            """
            
        # Combine into complete HTML structure
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Athlete Performance Summary - {athlete.user.full_name}</title>
            <style>
                body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.5; padding: 30px; }}
                .header {{ border-bottom: 3px solid #00f2fe; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }}
                .brand {{ font-size: 24px; font-weight: bold; color: #00f2fe; text-transform: uppercase; }}
                .profile-grid {{ display: grid; grid-template-columns: 2fr 1fr; gap: 30px; margin-bottom: 30px; }}
                .section {{ border: 1px solid #ddd; border-radius: 6px; padding: 20px; background: #fafafa; }}
                h2 {{ font-size: 18px; color: #141825; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
                th {{ text-align: left; background: #eee; padding: 8px 12px; font-size: 12px; text-transform: uppercase; color: #666; }}
                td {{ padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }}
                .badge {{ display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; }}
                .badge-high {{ background: rgba(255, 77, 77, 0.1); color: #ff4d4d; }}
                .badge-medium {{ background: rgba(255, 174, 0, 0.1); color: #ffae00; }}
                .badge-low {{ background: rgba(14, 219, 137, 0.1); color: #0edb89; }}
                .metric-box {{ display: flex; justify-content: space-between; border-bottom: 1px dashed #eee; padding: 8px 0; font-size: 13px; }}
                .metric-val {{ font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="brand">⚡ Athlete Hub Report</div>
                    <div style="font-size:12px;color:#777;">Clinical Kinematics & Workload Audit</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:bold;font-size:18px;">{athlete.user.full_name}</div>
                    <div style="font-size:12px;color:#777;">Sport: {athlete.sport or 'Unassigned'}</div>
                </div>
            </div>

            <div class="profile-grid">
                <div>
                    <div class="section" style="margin-bottom:20px;">
                        <h2>ML Injury Risk Assessment</h2>
                        <div style="display:flex;align-items:center;gap:30px;margin-bottom:15px;">
                            <div style="text-align:center;">
                                <div style="font-size:36px;font-weight:bold;color:{'#ff4d4d' if prediction['risk_level'] == 'High' else '#ffae00' if prediction['risk_level'] == 'Medium' else '#0edb89'};">{prediction['injury_risk_pct']}%</div>
                                <div style="font-size:10px;text-transform:uppercase;color:#777;">Risk Index</div>
                            </div>
                            <div>
                                <div style="font-weight:bold;font-size:15px;margin-bottom:5px;">Risk Category: {prediction['risk_level']}</div>
                                <div style="font-size:12px;color:#555;">Recommended Recovery: {prediction['recommended_recovery_days']} days</div>
                            </div>
                        </div>
                        
                        <div style="font-size:12px;background:#fff;border:1px solid #e5e5e5;padding:10px;border-radius:4px;">
                            <strong>Primary Warning Factors:</strong>
                            <ul style="margin:5px 0 0 15px;padding:0;">
                                {"".join(f"<li style='margin-bottom:3px;'>{f}</li>" for f in prediction['primary_factors'])}
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div class="section" style="height:calc(100% - 40px);">
                        <h2>Workload Profile</h2>
                        <div class="metric-box">
                            <span>Acute Load (7-day)</span>
                            <span class="metric-val">{acwr['acute_workload']}</span>
                        </div>
                        <div class="metric-box">
                            <span>Chronic Load (28-day)</span>
                            <span class="metric-val">{acwr['chronic_workload']}</span>
                        </div>
                        <div class="metric-box">
                            <span>ACWR Ratio</span>
                            <span class="metric-val" style="color:{'#ff4d4d' if acwr['risk_factor'] == 'high' else '#0edb89'};">{acwr['acwr']}</span>
                        </div>
                        <div class="metric-box">
                            <span>Biomechanics Symmetry</span>
                            <span class="metric-val">{mock_biomechanics.get('symmetry_index', 100.0)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {f'''<div class="section" style="margin-bottom:20px;"><h2>Explainable Athlete Intelligence Assessment</h2><div class="metric-box"><span>Overall risk score</span><span class="metric-val">{assessment.injury_risk_score}/100 ({assessment.risk_category})</span></div><div class="metric-box"><span>Movement quality</span><span class="metric-val">{assessment.movement_quality_score}/100</span></div><div class="metric-box"><span>Biomechanical efficiency</span><span class="metric-val">{assessment.biomechanical_efficiency_score}/100</span></div><div class="metric-box"><span>Fatigue risk</span><span class="metric-val">{assessment.fatigue_risk_score}/100</span></div><p style="font-size:11px;color:#777;">{DISCLAIMER}</p></div>''' if assessment else ''}

            <div class="section" style="margin-bottom:20px;">
                <h2>Recent Training Timeline (Max 10 Sessions)</h2>
                {f"<table><thead><tr><th>Date</th><th>Activity</th><th>Duration</th><th>RPE Score</th><th>Calculated Load</th></tr></thead><tbody>{training_rows}</tbody></table>" if training_rows else "<p style='color:#777;'>No activities logged.</p>"}
            </div>

            <div class="section">
                <h2>Clinical Trauma & Recovery Logs</h2>
                {f"<table><thead><tr><th>Date</th><th>Region</th><th>Severity</th><th>Status</th><th>Notes</th></tr></thead><tbody>{injury_rows}</tbody></table>" if injury_rows else "<p style='color:#777;'>No historical trauma events logged.</p>"}
            </div>
            
            <div style="text-align:center;font-size:10px;color:#999;margin-top:30px;border-top:1px solid #eee;padding-top:10px;">
                Athlete Performance Hub. Report compiled dynamically. Confidential - Athletic Medical Records.
            </div>
        </body>
        </html>
        """
        return html
