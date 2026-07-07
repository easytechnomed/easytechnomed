import React from "react";

export function Table({ className = "", children, ...props }) {
  return (
    <div className="w-full overflow-auto rounded-lg border border-slate-200 bg-white">
      <table className={`w-full caption-bottom text-sm ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className = "", children, ...props }) {
  return (
    <thead className={`bg-slate-50 border-b border-slate-200 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className = "", children, ...props }) {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableHead({ className = "", children, ...props }) {
  return (
    <th
      className={`h-12 px-4 text-left align-middle font-semibold text-slate-500 [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableRow({ className = "", children, ...props }) {
  return (
    <tr
      className={`transition-colors hover:bg-slate-50 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableCell({ className = "", children, ...props }) {
  return (
    <td
      className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 text-slate-700 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
