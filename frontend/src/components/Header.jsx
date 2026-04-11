
import React from 'react';
import { Menu, LogIn, HelpCircle, Globe, Zap } from 'lucide-react';

export const Header = () => {
  return (
    
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-100 bg-white/80 backdrop-blur-md px-6 lg:px-10 py-3 dark:bg-background-dark/90 dark:border-white/10 transition-all">
      <div className="flex items-center gap-3 text-gray-900 dark:text-white">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
           <Zap className="fill-current" size={24} />
        </div>
        <h2 className="text-xl font-extrabold leading-tight tracking-tight">MoneyGram</h2>
      </div>
      
      <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
        <nav className="flex items-center gap-6 lg:gap-9">
          <a className="text-gray-700 dark:text-gray-200 text-sm font-semibold hover:text-primary transition-colors" href="#">Send Money</a>
          <a className="text-gray-700 dark:text-gray-200 text-sm font-semibold hover:text-primary transition-colors" href="#">Track Transfer</a>
          <a className="text-gray-700 dark:text-gray-200 text-sm font-semibold hover:text-primary transition-colors" href="#">Help</a>
          <a className="text-gray-700 dark:text-gray-200 text-sm font-semibold hover:text-primary transition-colors" href="#">Log In</a>
        </nav>
        <button className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-xl h-10 px-6 bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all text-gray-900 text-sm font-bold">
          Sign Up
        </button>
      </div>

      <button className="md:hidden p-2 text-gray-800 dark:text-white">
        <Menu size={24} />
      </button>
    </header>
  );
};
