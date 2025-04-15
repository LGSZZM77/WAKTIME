import "./Header.css";
import React, { useEffect, useState } from "react";
import { Sun, Moon, Menu } from "lucide-react";
import MenuList from "./MenuList/MenuList";

function Header() {
  const [colorMode, setColorMode] = useState(false);
  const [navMode, setNavMode] = useState(false);

  useEffect(() => {
    if (colorMode) {
      document.querySelector("html").classList.add("dark");
    } else {
      document.querySelector("html").classList.remove("dark");
    }
  }, [colorMode]);

  return (
    <header>
      <div className="header_wrap container">
        <div className="header_left">
          <h1 className="logo fb">WAKTIME</h1>
          <nav className="menu">
            <MenuList />
          </nav>
        </div>
        <div className="header_right">
          <button
            className="colorMode_btn"
            onClick={() => setColorMode(!colorMode)}
          >
            {colorMode ? <Moon /> : <Sun />}
          </button>
          <button className="menu_btn" onClick={() => setNavMode(!navMode)}>
            <Menu />
          </button>
        </div>
      </div>
      {navMode ? (
        <nav className="mobile_menu">
          <MenuList />
        </nav>
      ) : null}
    </header>
  );
}

export default Header;
