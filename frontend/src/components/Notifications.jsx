// src/components/Notifications.jsx

import React, { useState } from 'react';
import { Bell, Trophy, Target, Settings, Check, X } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  // Helper to get the correct icon with the theme color
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'challenge': return <Target className="w-5 h-5 text-primary" />;
      case 'achievement': return <Trophy className="w-5 h-5 text-secondary" />;
      case 'system': return <Settings className="w-5 h-5 text-gray-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Helper to get the correct background and border based on type and read status
  const getNotificationBg = (type, read) => {
    if (read) return 'bg-white/50 border-gray-200/50';
    
    switch (type) {
      case 'challenge': return 'bg-primary/10 border-primary/20';
      case 'achievement': return 'bg-secondary/10 border-secondary/20';
      case 'system': return 'bg-gray-200/80 border-gray-300/80';
      default: return 'bg-white/60 border-gray-200/80';
    }
  };
  
  // Helper to format the timestamp
  const formatTime = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with your progress and new challenges</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all duration-200 font-medium">
            <Check className="w-4 h-4" />
            Mark all read
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-200/80 text-gray-600 rounded-lg hover:bg-gray-300/80 transition-all duration-200 font-medium">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-6 rounded-xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-gray-200/60 ${getNotificationBg(notification.type, notification.read)}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-200/80 flex items-center justify-center">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`font-semibold mb-1 ${notification.read ? 'text-gray-600' : 'text-text'}`}>
                      {notification.title}
                    </h3>
                    <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.timestamp)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.type === 'challenge' ? 'bg-primary/20 text-primary' :
                        notification.type === 'achievement' ? 'bg-secondary/20 text-secondary' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {notification.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    )}
                    <button className="text-gray-400 hover:text-accent transition-colors duration-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {notifications.length === 0 && (
        <div className="text-center py-20 bg-white/50 border border-gray-200/60 rounded-xl mt-6">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No notifications yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">We'll notify you when there are updates on your challenges and achievements.</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;