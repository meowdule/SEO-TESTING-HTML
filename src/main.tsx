import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import * as AppData from "./lib/appData";
import "./styles/global.css";

const raw = import.meta.env.BASE_URL;
const basename = raw === "/" ? undefined : raw.replace(/\/$/, "") || undefined;

void AppData.init().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
});
