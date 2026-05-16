import { useEffect } from "react";
import { Toaster } from "sonner";
import { AppRouter } from "../routes/AppRouter";
import { useAuthStore } from "../store/authStore";
import { useSocketEvents } from "../hooks/useSocketEvents";
import { useSocketStore } from "../store/socketStore";

const App = () => {
  const initialize = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);

  useEffect(() => {
    initialize();
  }, []); // Empty dependency array - run only once on mount

  useEffect(() => {
    if (isAuthenticated) {
      connect();
      return;
    }
    disconnect();
  }, [isAuthenticated, connect, disconnect]);

  useSocketEvents();

  return (
    <>
      <AppRouter />
      <Toaster richColors />
    </>
  );
};

export { App };
