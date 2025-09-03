import React from 'react';

interface ChoiceButtonProps {
  onClick: () => void;
  className: string;
  shadowClassName: string;
  title: string;
  subtitle?: string;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  onClick,
  className,
  shadowClassName,
  title,
  subtitle,
}) => {
  const baseClasses = "text-white font-bold py-8 px-6 rounded-xl transition-all duration-300 border transform hover:-translate-y-2";
  const shadowClasses = `shadow-lg ${shadowClassName}`;

  return (
    <button onClick={onClick} className={`${baseClasses} ${className} ${shadowClasses}`}>
      <span className="text-2xl font-tajawal">{title}</span>
      {subtitle && <span className="block text-sm font-normal mt-1">{subtitle}</span>}
    </button>
  );
};

export default ChoiceButton;