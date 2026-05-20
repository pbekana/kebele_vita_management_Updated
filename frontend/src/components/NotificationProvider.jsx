import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const NotificationContext = createContext({
  notify: () => {},
  notifySuccess: () => {},
  notifyError: () => {},
  notifyWarning: () => {},
});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const nextId = useRef(1);

  const removeNotification = useCallback((id) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const notify = useCallback(
    ({ type = 'info', message }) => {
      if (!message) return;
      const id = nextId.current++;
      setNotifications((current) => [...current, { id, type, message }]);
      window.setTimeout(() => removeNotification(id), 4500);
    },
    [removeNotification]
  );

  const contextValue = useMemo(
    () => ({
      notify,
      notifySuccess: (message) => notify({ type: 'success', message }),
      notifyError: (message) => notify({ type: 'error', message }),
      notifyWarning: (message) => notify({ type: 'warning', message }),
    }),
    [notify]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}

function NotificationContainer({ notifications, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3 px-2">
      {notifications.map((notification) => {
        const baseStyles =
          'rounded-2xl border p-4 shadow-lg ring-1 ring-black/5 backdrop-blur-sm';
        const messageStyles =
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : notification.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-900'
            : 'bg-yellow-50 border-yellow-200 text-yellow-900';

        return (
          <div key={notification.id} className={`${baseStyles} ${messageStyles}`} role="status">
            <div className="flex items-start gap-3">
              <div className="text-2xl leading-none">
                {notification.type === 'success' && '✅'}
                {notification.type === 'error' && '❌'}
                {notification.type === 'warning' && '⚠️'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold capitalize">{notification.type}</p>
                <p className="mt-1 text-sm leading-6">{notification.message}</p>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(notification.id)}
                className="text-sm font-semibold text-current opacity-70 transition hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
