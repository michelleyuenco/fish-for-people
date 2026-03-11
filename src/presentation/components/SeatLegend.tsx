import React from 'react';
import { useTranslation } from 'react-i18next';

interface SeatLegendProps {
  showRowToggle?: boolean;
}

export const SeatLegend: React.FC<SeatLegendProps> = ({ showRowToggle = false }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
      <span className="flex items-center gap-0.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-success inline-block" /> {t('seats.legendFree')}
      </span>
      <span className="flex items-center gap-0.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-occupied inline-block" /> {t('seats.legendTaken')}
      </span>
      <span className="flex items-center gap-0.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-blue-300 inline-block" /> {t('seats.legendFamily')}
      </span>
      <span className="flex items-center gap-0.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-purple-300 inline-block" /> {t('seats.legendVolunteer')}
      </span>
      {showRowToggle && (
        <span className="flex items-center gap-0.5">
          <span className="w-[5px] h-2.5 rounded-sm bg-gray-300 inline-block" /> {t('seats.legendRowToggle')}
        </span>
      )}
    </div>
  );
};
