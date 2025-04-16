import "./App.css";
import Header from "./components/views/Header/Header";
import Carousel from "./components/views/Carousel/Carousel";
import Activity from "./components/views/Activity/Activity";

function App() {
  return (
    <div className="App">
      <>
        <Header />
        <Carousel />
        <Activity />
      </>
    </div>
  );
}

export default App;
