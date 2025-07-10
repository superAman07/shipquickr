type DashboardWelcomeProps = {
   name: string;
   message?: string;
};
  
export default function DashboardWelcome({ name, message }: DashboardWelcomeProps) {
  return (
    <div className="mb-4 pt-6 sm:pt-3">
      <h2 className="text-xl sm:text-2xl text-gray-100 sm:text-[#495057] dark:text-gray-100 pl-2 md:pl-0 font-bold">Welcome, <span className="text-[#389bde]">{name}</span>  👋</h2>
      {message && <p className="text-gray-500">{message}</p>}
    </div>
  );
}