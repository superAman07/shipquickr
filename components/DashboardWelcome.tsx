type DashboardWelcomeProps = {
   name: string;
   message?: string;
};
  
export default function DashboardWelcome({ name, message }: DashboardWelcomeProps) {
  return (
    // Added relative z-10 so the text safely sits firmly above the background banner
    <div className="mb-4 pt-6 sm:pt-3 relative z-10">
      {/* Changed sm:text-[#495057] to sm:text-white */}
      <h2 className="text-xl sm:text-2xl text-gray-100 sm:text-white pl-2 md:pl-0 font-bold">
        Welcome, <span className="text-[#38bdf8]">{name}</span>  👋
      </h2>
      {message && <p className="text-gray-500 sm:text-gray-300">{message}</p>}
    </div>
  );
}