import React from "react";
import { Link, useLocation } from "react-router-dom";

function MenuList() {
  const location = useLocation();

  const menu = [
    { name: "메인", path: "/" },
    { name: "이세계아이돌", path: "/isedol" },
    { name: "팬아트", path: "/fanart" },
    { name: "소개", path: "/intro" },
  ];

  return (
    <ul className="menu_lists">
      {menu.map((menu, index) => (
        <li key={index}>
          <Link
            to={menu.path}
            className={location.pathname === menu.path ? "current_menu" : ""}
          >
            {menu.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default MenuList;
