interface PumpkinIconProps {
  className?: string;
}

const PumpkinIcon = ({ className = '' }: PumpkinIconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M3 14.5a9 6.5 0 1 0 18 0a9 6.5 0 1 0-18 0zM6.6 14l2.2-3.2L11 14zM13 14l2.2-3.2L17.4 14zM6.8 16h10.4l-1.7 2.6-1.7-1.5-1.8 1.5-1.8-1.5-1.7 1.5z"
    />
    <path stroke="currentColor" strokeWidth={2} strokeLinecap="round" d="M12 8c0-2 .9-3.6 2.6-4.4" />
  </svg>
);

export default PumpkinIcon;
