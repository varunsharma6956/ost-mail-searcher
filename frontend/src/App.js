import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import OSTExplorer from "./components/OSTExplorer";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OSTExplorer />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
