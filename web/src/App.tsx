import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Overlay } from "./pages/Overlay";
import { Plaza } from "./pages/Plaza";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/overlay" element={<Overlay />} />
        <Route path="/plaza" element={<Plaza />} />
      </Routes>
    </BrowserRouter>
  );
}
