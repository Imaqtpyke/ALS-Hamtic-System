import { HeartIcon } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0038A8] text-white">
      <div className="w-full py-6 px-4 flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-blue-200">
          © 2026 Department of Education - Alternative Learning System, Hamtic, Antique. All rights reserved.
        </p>
        <div className="flex items-center justify-center text-blue-300">
          <span className="text-xs">Made with</span>
          <HeartIcon className="h-3.5 w-3.5 mx-1 text-red-400 fill-red-400" />
          <span className="text-xs">for education</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;