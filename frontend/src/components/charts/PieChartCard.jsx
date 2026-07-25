import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#7CFC00",
  "#FFD54F",
  "#FF5252",
];

function PieChartCard({ data }) {

  const renderLabel = ({ name, value }) => {
  if (value === 0) return "";
  return `${name}: ${value}`;
};

  return (
    <div className="chart-card">

      <h3>Risk Distribution</h3>

      <ResponsiveContainer
        width="100%"
        height={280}
      >
        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            labelLine={false}
            label={({ name, value }) =>
                value > 0 ? `${name}: ${value}` : ""
            }
            >

            {data.map((entry, index) => (

              <Cell
                key={entry.name}
                fill={COLORS[index]}
              />

            ))}


          </Pie>
    

          <Tooltip />

          <Legend />

        </PieChart>

      </ResponsiveContainer>

    </div>
  );
}

export default PieChartCard;