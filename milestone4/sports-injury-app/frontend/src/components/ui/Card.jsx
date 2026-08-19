export default function Card({ children, className = "", padded = true, glow = false, ...rest }) {
  return (
    <div
      className={`glass-panel rounded-2xl shadow-panel ${glow ? "shadow-glow" : ""} ${padded ? "p-6" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
