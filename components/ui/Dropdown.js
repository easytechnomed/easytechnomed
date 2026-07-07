"use client";

import React, { useState, useRef, useEffect } from "react";

export function Dropdown({ trigger, children, align = "right", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const alignmentClasses = {
    left: "left-0",
    right: "right-0",
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${alignmentClasses[align]} z-30 mt-2 w-48 origin-top-right rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 focus:outline-none ${className}`}
        >
          <div className="py-1" onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
