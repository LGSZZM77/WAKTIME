import "./Header.css";
import React, { useEffect, useState } from "react";
import { Sun, Moon, Menu } from "lucide-react";
import MenuList from "./MenuList/MenuList";

function Header() {
  const [colorMode, setColorMode] = useState(() => {
    const savedMode = localStorage.getItem("color-mode");
    return savedMode === "dark";
  });
  const [navMode, setNavMode] = useState(false);

  useEffect(() => {
    if (colorMode) {
      document.querySelector("html").classList.add("dark");
      localStorage.setItem("color-mode", "dark");
    } else {
      document.querySelector("html").classList.remove("dark");
      localStorage.setItem("color-mode", "light");
    }
  }, [colorMode]);

  return (
    <header>
      <div className="container">
        <div className="header_wrap">
          <div className="header_left">
            <a href="/">
              <h1 className="logo fb">WAKTIME</h1>
            </a>
            <nav className="menu">
              <MenuList />
            </nav>
          </div>
          <div className="header_right">
            <button
              className="colorMode_btn"
              onClick={() => setColorMode(!colorMode)}
              aria-label={colorMode ? "다크 모드로 전환" : "라이트 모드로 전환"}
            >
              {colorMode ? <Moon /> : <Sun />}
            </button>
            <button
              className="menu_btn"
              onClick={() => setNavMode(!navMode)}
              aria-label={navMode ? "메뉴 닫기" : "메뉴 열기"}
            >
              <Menu />
            </button>
          </div>
        </div>
      </div>
      {navMode ? (
        <nav className="mobile_menu">
          <div className="mobile_menu_container">
            <MenuList />
          </div>
        </nav>
      ) : null}
    </header>
  );
}

export default Header;
