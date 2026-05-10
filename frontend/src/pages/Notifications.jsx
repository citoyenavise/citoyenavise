import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Loader } from '../components/ui/Loader';

export function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: 'Marie a aimé votre post',
      timestamp: new Date(),
      read: false,
    },
    {
      id: 2,
      message: 'Jean a commenté votre post',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
    },
    {
      id: 3,
      message: 'Sophie vous suit maintenant',
      timestamp: new Date(Date.now() - 86400000),
      read: true,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <span className="bg-error text-white px-3 py-1 rounded-full text-sm">
            {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">Aucune notification pour le moment</p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition ${
                !notification.read ? 'bg-blue-50 border-l-4 border-primary' : ''
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex gap-4 items-start">
                <Avatar name="User" size="sm" />
                <div className="flex-1">
                  <p className={`${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.message}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-3 h-3 bg-primary rounded-full mt-2"></div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
