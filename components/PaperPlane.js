export default function PaperPlane() {
  return (
    <div className="paper-plane-wrap" aria-hidden="true">
      <svg
        className="paper-plane"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M21 3L3 10.5L11 12.5L13 20.5L21 3Z"
          fill="#E8A0AE"
          stroke="#D4738A"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path d="M11 12.5L21 3L13 20.5L11 12.5Z" fill="#F2C1CB" />
      </svg>

      <style jsx>{`
        .paper-plane-wrap {
          position: absolute;
          top: 0;
          left: -40px;
          animation: fly-across 9s ease-in-out infinite;
          pointer-events: none;
        }
        .paper-plane {
          display: block;
          transform: rotate(20deg);
          animation: bob 1.4s ease-in-out infinite;
        }

        @keyframes fly-across {
          0% {
            left: -40px;
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          45% {
            opacity: 1;
          }
          55% {
            opacity: 0;
          }
          100% {
            left: 110%;
            opacity: 0;
          }
        }

        @keyframes bob {
          0%,
          100% {
            transform: rotate(20deg) translateY(0);
          }
          50% {
            transform: rotate(24deg) translateY(-4px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .paper-plane-wrap,
          .paper-plane {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
