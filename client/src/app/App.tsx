import { useEffect } from "react";
import { Toaster } from "sonner";
import { AppRouter } from "../routes/AppRouter";
import { useAuthStore } from "../store/authStore";
import { useSocketEvents } from "../hooks/useSocketEvents";

const App = () => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useSocketEvents();

  return (
    <>
      <AppRouter />
      <Toaster richColors />
    </>
  );
};

export { App };
