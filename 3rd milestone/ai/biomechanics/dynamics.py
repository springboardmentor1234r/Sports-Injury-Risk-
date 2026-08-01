"""
Dynamics Module.
Calculates forces, torques, and power.
"""
import numpy as np

def estimate_ground_reaction_force(mass_kg: float, acceleration_y: float) -> float:
    """
    Estimate Ground Reaction Force (GRF) using Newton's Second Law.
    
    Formula:
        F = m * (g + a)
        
    Args:
        mass_kg (float): Subject mass in kg
        acceleration_y (float): Vertical acceleration of CoM in m/s^2
        
    Returns:
        float: Estimated GRF in Newtons
    """
    g = 9.81 # Gravity
    return mass_kg * (g + acceleration_y)

def calculate_joint_moment(moment_of_inertia: float, angular_acceleration: float) -> float:
    """
    Calculate Joint Moment (Torque).
    
    Formula:
        Torque = I * alpha
        
    Args:
        moment_of_inertia (float): Segment moment of inertia (kg*m^2)
        angular_acceleration (float): Angular acceleration (rad/s^2)
        
    Returns:
        float: Torque in Nm
    """
    return moment_of_inertia * angular_acceleration

def calculate_joint_power(torque: float, angular_velocity_rad: float) -> float:
    """
    Calculate Joint Power.
    
    Formula:
        Power = Torque * omega
        
    Args:
        torque (float): Joint torque in Nm
        angular_velocity_rad (float): Angular velocity in rad/s
        
    Returns:
        float: Power in Watts
    """
    return torque * angular_velocity_rad
