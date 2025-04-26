import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/views/Header/Header";
import Footer from "./components/views/Footer/Footer";

import MainPage from "./pages/MainPage";
import IsedolPage from "./pages/IsedolPage";
import FanArtPage from "./pages/FanArtPage";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/isedol" element={<IsedolPage />} />
        <Route path="/fanart" element={<FanArtPage />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
