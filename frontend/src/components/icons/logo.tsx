import * as React from 'react';

function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 18h16" />
      <path d="M8 18V8a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v10" />
      <path d="M12 4v14" />
    </svg>
  );
}

export default Logo;
