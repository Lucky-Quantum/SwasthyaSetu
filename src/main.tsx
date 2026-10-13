import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { CareProvider } from "./store/careStore";
import ChatWidget from "../components/ChatWidget";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CareProvider>
      <App />
      <ChatWidget />
    </CareProvider>
  </React.StrictMode>,
);
