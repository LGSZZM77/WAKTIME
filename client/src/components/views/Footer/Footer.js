import React from "react";
import "./Footer.css";
import { Github, Instagram, Youtube } from "lucide-react";
import NotionIcon from "./NotionIcon";

function Footer() {
  return (
    <footer>
      <div className="footer_wrap">
        <div className="footer_sns">
          <span>
            <a href="https://github.com/LGSZZM77" target="_blank">
              <Github />
            </a>
          </span>
          <span>
            <a href="https://www.instagram.com/igyuseong2859/" target="_blank">
              <Instagram />
            </a>
          </span>
          <span>
            <a href="https://www.youtube.com/@cogyusung" target="_blank">
              <Youtube />
            </a>
          </span>
          <span>
            <a
              href="https://www.notion.so/HOME-1496a2071d5d80bdbf67d96aa1257e43?pvs=4"
              target="_blank"
            >
              <NotionIcon />
            </a>
          </span>
        </div>
        <div className="footer_text">
          <div className="footer_text_top">
            <p>개발자 정보</p>
            <span>|</span>
            <p>개인정보 처리방침 및 운영방침</p>
          </div>
          <div className="footer_text_bottom">
            WAKTIME은 웹개발 공부를 목적으로한 팬사이트이며 <br />
            개인이 운영하는 사이트입니다.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
