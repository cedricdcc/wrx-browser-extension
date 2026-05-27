interface StatCardProps {
  title: string;
  value: React.ReactNode;
}

export const StatCard = ({ title, value }: StatCardProps) => {
  return (
    <div className="stat-card">
      <span className="stat-title">{title}</span>
      {value}
    </div>
  );
};
