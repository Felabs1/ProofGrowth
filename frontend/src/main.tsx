import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { installGlobalDebugHandlers } from "./app/utils/debug.ts";
import "./styles/index.css";

installGlobalDebugHandlers();

createRoot(document.getElementById("root")!).render(<App />);
