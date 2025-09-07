import React from "react";

const Footer = () => {
  return (
    <div>
      <footer className="relative z-10 text-center py-8 text-sm text-foreground/60">
        © {new Date().getFullYear()} Option Flow. All rights reserved.
      </footer>
    </div>
  );
};

export default Footer;
