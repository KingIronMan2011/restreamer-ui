import React from 'react';

type NotificationSeverity = 'error' | 'warning' | 'info' | 'success';

type NotifyContextValue = {
  Dispatch: (
    severity: NotificationSeverity,
    type: string,
    message: string,
  ) => void;
};

const NotifyContext = React.createContext<NotifyContextValue>({
  Dispatch: () => {},
});

export const NotifyProvider = NotifyContext.Provider;
export const NotifyConsumer = NotifyContext.Consumer;

export default NotifyContext;
