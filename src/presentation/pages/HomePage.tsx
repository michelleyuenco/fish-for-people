import React from 'react';
import type { UserRole } from '../../domain/models/Service';

interface HomePageProps {
  onSelectRole: (role: UserRole) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo / Header */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-4xl">🐟</span>
        </div>
        <h1 className="text-3xl font-bold text-primary">Fish for People</h1>
        <p className="text-gray-500 mt-2 text-sm">Saddleback Church HK • Welcome Team</p>
      </div>

      {/* Role Selection */}
      <div className="w-full max-w-sm space-y-4">
        <p className="text-center text-gray-600 font-medium mb-6">I am a...</p>

        <button
          onClick={() => onSelectRole('welcome-team')}
          className="w-full bg-primary text-white rounded-2xl p-5 text-left shadow-md active:scale-98 transition-all hover:bg-primary/90"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              🎖️
            </div>
            <div>
              <div className="font-bold text-lg">Welcome Team</div>
              <div className="text-white/70 text-sm mt-0.5">
                Manage seats, resolve requests & count attendance
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelectRole('congregation')}
          className="w-full bg-white border-2 border-primary text-primary rounded-2xl p-5 text-left shadow-sm active:scale-98 transition-all hover:bg-primary/5"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              🙏
            </div>
            <div>
              <div className="font-bold text-lg text-primary">Congregation</div>
              <div className="text-gray-500 text-sm mt-0.5">
                Request help during the service
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 mt-10 text-center">
        Your role is saved for this session
      </p>
    </div>
  );
};
