export default function LoadingBar() {
    return (
      <div className="fixed top-0 left-0 w-full h-1 z-50">
        <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-loading"></div>
      </div>
    );
  }