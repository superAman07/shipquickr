type DashboardWelcomeProps = {
   name: string;
   message?: string;
};
  
export default function DashboardWelcome({ name, message }: DashboardWelcomeProps) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-bold">Welcome, {name} 👋</h2>
      {message && <p className="text-gray-500">{message}</p>}
    </div>
  );
}